"""Universal In-Place Container Swapper.

Zero-dependency implementation of the Ephemeral Swapper Protocol using standard library
HTTP client communication over the Docker Engine Unix Domain Socket.
"""

from datetime import datetime, timezone
import http.client
import json
import os
import socket
import sys
import time
from typing import Any


class DockerUnixSocketClient:
    """Minimal dependency-free HTTP client communicating over Docker Unix Domain Socket."""

    def __init__(self, socket_path: str = "/var/run/docker.sock") -> None:
        self.socket_path = socket_path

    def request(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None = None,
        timeout: float = 30.0,
    ) -> tuple[int, Any]:
        """Execute HTTP request through Unix domain socket."""
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect(self.socket_path)

        conn = http.client.HTTPConnection("localhost")
        conn.sock = sock

        headers = {"Host": "localhost", "Accept": "application/json"}
        encoded_body = None
        if body is not None:
            encoded_body = json.dumps(body)
            headers["Content-Type"] = "application/json"

        conn.request(method, path, body=encoded_body, headers=headers)
        resp = conn.getresponse()
        raw_data = resp.read()

        try:
            data = json.loads(raw_data.decode("utf-8")) if raw_data else None
        except Exception:
            data = raw_data.decode("utf-8", errors="replace")

        return resp.status, data


class UniversalContainerSwapper:
    """Manages atomic in-place container upgrade and handoff."""

    def __init__(self, socket_path: str = "/var/run/docker.sock") -> None:
        self.client = DockerUnixSocketClient(socket_path)
        self.socket_path = socket_path

    def is_available(self) -> bool:
        """Verify Docker socket presence and daemon responsiveness."""
        if not os.path.exists(self.socket_path) or os.name == "nt":
            return False
        try:
            status, _ = self.client.request("GET", "/_ping", timeout=2.0)
            return status == 200
        except Exception:
            return False

    def execute_swap(self, target_image: str) -> dict[str, Any]:
        """Execute complete in-place container swap.
        
        Args:
            target_image: Fully qualified target image (e.g. 'registry.example.com/app:v1.2.0')
        """
        if not self.is_available():
            raise RuntimeError(f"Docker socket unavailable at {self.socket_path}")

        # 1. Discover identity of current container
        current_hostname = socket.gethostname()

        # 2. Pull target image
        pull_status, _ = self.client.request(
            "POST",
            f"/images/create?fromImage={target_image}",
            timeout=180.0,
        )
        if pull_status not in (200, 204):
            raise RuntimeError(f"Failed pulling image {target_image}: status {pull_status}")

        # 3. Inspect running container configuration
        inspect_status, info = self.client.request(
            "GET",
            f"/containers/{current_hostname}/json",
            timeout=10.0,
        )
        if inspect_status != 200 or not isinstance(info, dict):
            raise RuntimeError(f"Failed inspecting current container {current_hostname}")

        orig_name = info.get("Name", "").lstrip("/")
        if not orig_name:
            orig_name = f"app-{current_hostname}"

        retire_name = f"{orig_name}-retiring-{int(datetime.now(timezone.utc).timestamp())}"

        # 4. Synthesize and preserve volume mounts into Binds
        host_config = dict(info.get("HostConfig", {}) or {})
        existing_binds = list(host_config.get("Binds") or [])
        inspect_mounts = info.get("Mounts") or []

        for m in inspect_mounts:
            src = m.get("Source") or m.get("Name")
            dest = m.get("Destination")
            rw = "rw" if m.get("RW", True) else "ro"
            if src and dest:
                bind_spec = f"{src}:{dest}:{rw}"
                if not any(b.startswith(f"{src}:{dest}") or b.endswith(f":{dest}:{rw}") for b in existing_binds):
                    existing_binds.append(bind_spec)

        if existing_binds:
            host_config["Binds"] = existing_binds

        # 5. Rename current container to free canonical name
        rename_status, _ = self.client.request(
            "POST",
            f"/containers/{current_hostname}/rename?name={retire_name}",
            timeout=10.0,
        )
        if rename_status not in (200, 204):
            raise RuntimeError(f"Failed renaming current container to {retire_name}")

        # 6. Create replacement container in stopped state
        create_payload = {
            "Image": target_image,
            "Env": info.get("Config", {}).get("Env", []),
            "Cmd": info.get("Config", {}).get("Cmd"),
            "Entrypoint": info.get("Config", {}).get("Entrypoint"),
            "Labels": info.get("Config", {}).get("Labels", {}),
            "HostConfig": host_config,
            "NetworkingConfig": {
                "EndpointsConfig": info.get("NetworkSettings", {}).get("Networks", {})
            },
        }

        create_status, create_res = self.client.request(
            "POST",
            f"/containers/create?name={orig_name}",
            body=create_payload,
            timeout=15.0,
        )
        if create_status not in (200, 201) or not isinstance(create_res, dict):
            # Rollback rename on create failure
            self.client.request("POST", f"/containers/{current_hostname}/rename?name={orig_name}")
            raise RuntimeError(f"Failed creating replacement container: {create_res}")

        new_container_id = create_res["Id"]

        # 7. Construct and launch Ephemeral Swapper Container
        swapper_name = f"swapper-{orig_name}-{int(datetime.now(timezone.utc).timestamp())}"
        swapper_code = (
            "import http.client, socket, time, sys\n"
            "time.sleep(1.5)\n"
            "def req(m, u):\n"
            "    s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)\n"
            "    s.connect('/var/run/docker.sock')\n"
            "    c = http.client.HTTPConnection('localhost')\n"
            "    c.sock = s\n"
            "    c.request(m, u)\n"
            "    r = c.getresponse()\n"
            "    r.read()\n"
            "    return r.status\n"
            f"req('POST', '/containers/{current_hostname}/stop?t=5')\n"
            f"start_code = req('POST', '/containers/{new_container_id}/start')\n"
            f"if start_code in (200, 204):\n"
            f"    req('DELETE', '/containers/{current_hostname}?v=false')\n"
            "sys.exit(0)\n"
        )

        swapper_payload = {
            "Image": target_image,
            "User": "0:0",
            "Cmd": ["python3", "-c", swapper_code],
            "HostConfig": {
                "AutoRemove": True,
                "Binds": [f"{self.socket_path}:/var/run/docker.sock"],
            },
        }

        swapper_status, swapper_res = self.client.request(
            "POST",
            f"/containers/create?name={swapper_name}",
            body=swapper_payload,
            timeout=10.0,
        )
        if swapper_status not in (200, 201) or not isinstance(swapper_res, dict):
            raise RuntimeError(f"Failed creating swapper container: {swapper_res}")

        swapper_id = swapper_res["Id"]
        self.client.request("POST", f"/containers/{swapper_id}/start", timeout=10.0)

        return {
            "status": "success",
            "old_container": current_hostname,
            "new_container": new_container_id,
            "target_image": target_image,
            "swapper_name": swapper_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 container-swapper.py <target-image>")
        sys.exit(1)

    target = sys.argv[1]
    swapper = UniversalContainerSwapper()
    try:
        result = swapper.execute_swap(target)
        print(json.dumps(result, indent=2))
    except Exception as exc:
        print(json.dumps({"status": "error", "error": str(exc)}), file=sys.stderr)
        sys.exit(1)
