---
​‌‍name: Smart Home
description: Unified smart home and IoT automation orchestrator bridging Home Assistant, Apple HomeKit, Amazon Alexa, Google Home, and Matter ecosystems into a cohesive agentic control plane.
version: 1
---

# Smart Home Automation & IoT Ecosystem Skill

This skill equips AI agents with unified command and orchestration capabilities across modern smart home platforms: Home Assistant, Apple HomeKit, Amazon Alexa, Google Home, and the Matter/Thread unified fabric.

---

## 1. Multi-Ecosystem Architectural Overview

The smart home landscape is fragmented across proprietary and open protocols. This skill unifies them through a multi-tier hub-and-spoke control plane:

* **Primary Automation Hub (Home Assistant)**: Acts as the local-first, low-latency coordinator hosting entity registries, state machines, hardware radios (Zigbee, Z-Wave, Matter, Thread, Bluetooth), and automation blueprints.
* **Apple HomeKit Ecosystem (HAP & MatterSupport)**: Exposes Home Assistant entities as virtual HomeKit accessories using the HomeKit Accessory Protocol (HAP) and facilitates native Swift / iOS accessory orchestration.
* **Amazon Alexa Smart Home**: Bridges voice intents and smart device directives via the Alexa Smart Home Skill API and AWS Lambda event adapters.
* **Google Home / Assistant**: Synchronizes devices with the Google Home Graph Cloud-to-Cloud protocol, mapping device traits and supporting local fulfillment.
* **Matter & Thread Fabric**: Manages multi-admin commissioning, permitting simultaneous device sharing across Apple Home, Google Home, and Home Assistant without cloud dependencies.

---

## 2. Core Automation Hub: Home Assistant Protocol Integration

### Environment Configuration
Configure your Home Assistant credentials in your project environment variables:
```bash
# Home Assistant instance URL (local IP, mDNS, or reverse proxy)
HOME_ASSISTANT_URL="http://192.168.1.100:8123"

# Long-Lived Access Token generated from Home Assistant profile
HOME_ASSISTANT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### REST API Operations

#### A. Health & Instance Diagnostics
Verify connectivity to the instance:
```bash
python .skills/smart-home/scripts/smart_home_client.py status
```
Direct HTTP verification:
```bash
curl -X GET "${HOME_ASSISTANT_URL}/api/" \
  -H "Authorization: Bearer ${HOME_ASSISTANT_TOKEN}" \
  -H "Content-Type: application/json"
```

#### B. Entity State Discovery & Polling
List all entities or filter by domain:
```bash
# List all entities in table format
python .skills/smart-home/scripts/smart_home_client.py list

# Filter entities by domain (light, switch, climate, sensor, lock, cover)
python .skills/smart-home/scripts/smart_home_client.py list --domain light

# Query specific entity state and attributes
python .skills/smart-home/scripts/smart_home_client.py get light.living_room_ceiling
```

#### C. Service Execution & Device Mutation
Dispatch service commands with JSON payloads:
```bash
# Turn on a light with brightness and color temperature
python .skills/smart-home/scripts/smart_home_client.py call light turn_on \
  --data '{"entity_id": "light.living_room_ceiling", "brightness": 210, "color_temp": 300}'

# Adjust thermostat setpoint
python .skills/smart-home/scripts/smart_home_client.py call climate set_temperature \
  --data '{"entity_id": "climate.main_thermostat", "temperature": 71, "hvac_mode": "cool"}'

# Trigger an automation or script
python .skills/smart-home/scripts/smart_home_client.py call automation trigger \
  --data '{"entity_id": "automation.evening_welcome_scene"}'
```

#### D. Jinja2 Template Evaluation
Evaluate dynamic state templates and Jinja2 calculations directly against the live state graph:
```bash
python .skills/smart-home/scripts/smart_home_client.py template \
  "The living room temperature is {{ states('sensor.living_room_temp') }} degrees and humidity is {{ states('sensor.living_room_humidity') }}%."
```

#### E. WebSocket Event Streaming Protocol
For real-time subscriptions without polling, establish a WebSocket connection:
1. Connect to `ws://<host>:8123/api/websocket`
2. Receive initial auth challenge: `{"type": "auth_required", "ha_version": "2026.x"}`
3. Send authentication: `{"type": "auth", "access_token": "YOUR_TOKEN"}`
4. Receive confirmation: `{"type": "auth_ok", "ha_version": "2026.x"}`
5. Subscribe to state change events:
   ```json
   {
     "id": 1,
     "type": "subscribe_events",
     "event_type": "state_changed"
   }
   ```

---

## 3. Apple HomeKit & HAP Mesh Protocol

### HomeKit Bridge Integration (Home Assistant)
Expose entities to Apple HomeKit by configuring the HomeKit integration in `configuration.yaml`:

```yaml
homekit:
  - name: "Core Home Bridge"
    port: 51827
    filter:
      include_domains:
        - light
        - switch
        - climate
        - cover
        - sensor
      exclude_entities:
        - light.garage_floodlights
    entity_config:
      climate.main_thermostat:
        name: "Main Thermostat"
```

* **Bridge vs Accessory Mode**: Use Bridge mode for standard devices (up to 150 accessories per bridge). Use Accessory mode for cameras, locks, and television media players which require standalone pairing.
* **Pairing PIN**: Home Assistant generates an 8-digit setup code (displayed in notifications and logs) formatted as `XXX-XX-XXX`.

### Native Apple HomeKit Framework Architecture (Swift)
When developing iOS, macOS, or watchOS smart home client software:

```swift
import HomeKit

final class SmartHomeManager: NSObject, HMHomeManagerDelegate {
    let homeManager = HMHomeManager()

    override init() {
        super.init()
        homeManager.delegate = self
    }

    func homeManagerDidUpdateHomes(_ manager: HMHomeManager) {
        guard let primaryHome = manager.primaryHome else { return }
        print("Loaded primary home: \(primaryHome.name)")
        
        for accessory in primaryHome.accessories {
            print("Accessory: \(accessory.name) in \(accessory.room?.name ?? "unassigned")")
            for service in accessory.services {
                for characteristic in service.characteristics {
                    if characteristic.characteristicType == HMCharacteristicTypePowerState {
                        print("  Power State: \(String(describing: characteristic.value))")
                    }
                }
            }
        }
    }
}
```

---

## 4. Amazon Alexa Smart Home Skill Integration

### Directive Handling Architecture
Amazon Alexa communicates with smart home devices via directive-response JSON contracts routed through AWS Lambda.

#### A. Discovery Directive (`Alexa.Discovery`)
Alexa requests the capability manifest of all available endpoints:
```json
{
  "directive": {
    "header": {
      "namespace": "Alexa.Discovery",
      "name": "Discover",
      "payloadVersion": "3",
      "messageId": "msg-001"
    },
    "payload": {
      "scope": {
        "type": "BearerToken",
        "token": "USER_OAUTH_TOKEN"
      }
    }
  }
}
```

#### B. Controller Directive (`Alexa.PowerController`)
Directives to mutate device states:
```json
{
  "directive": {
    "header": {
      "namespace": "Alexa.PowerController",
      "name": "TurnOn",
      "payloadVersion": "3",
      "messageId": "msg-002",
      "correlationToken": "token-123"
    },
    "endpoint": {
      "endpointId": "light.kitchen_lights"
    },
    "payload": {}
  }
}
```

#### C. Home Assistant Alexa Configuration
Filter and publish endpoints directly to Alexa:
```yaml
alexa:
  smart_home:
    filter:
      include_domains:
        - light
        - switch
        - climate
    entity_config:
      light.kitchen_lights:
        name: "Kitchen Lighting"
        description: "Recessed kitchen LED ceiling array"
        display_categories: LIGHT
```

---

## 5. Google Home / Assistant & Home Graph Protocol

### Smart Home Actions Protocol
Google Home interacts with hubs via four primary cloud intents:

* **`action.devices.SYNC`**: Queries all devices, capabilities, and traits linked to the user account.
* **`action.devices.QUERY`**: Fetches current real-time state attributes for specific device IDs.
* **`action.devices.EXECUTE`**: Dispatches commands to update device states based on intent traits.
* **`action.devices.DISCONNECT`**: Revokes account linkage.

### Trait Mappings
* **`action.devices.traits.OnOff`**: Power state control for switches and basic fixtures.
* **`action.devices.traits.Brightness`**: Percentage-based dimming control.
* **`action.devices.traits.ColorSetting`**: RGB, HSV, and temperature spectrum adjustments.
* **`action.devices.traits.TemperatureSetting`**: Target temperature, cooling/heating modes, ambient reports.
* **`action.devices.traits.LockUnlock`**: Physical deadlock management requiring security PINs.

---

## 6. Matter & Thread Multi-Admin Fabric

### Commissioning Matter Hardware
Matter simplifies interoperability across Apple, Google, Amazon, and Home Assistant:
* **Commissioning Credentials**: 11-digit or 21-digit manual pairing code, or a scanned QR code payload.
* **Thread Border Routers (OTBR)**: Coordinates low-power mesh radios (e.g. Apple TV 4K, HomePod Mini, Home Assistant Yellow, Nest Hub).
* **Multi-Admin Sharing**: To share a Matter device already paired with Home Assistant to Apple Home:
  1. Open commissioning window on Home Assistant: `matter.open_commissioning_window`
  2. Home Assistant generates an ephemeral setup payload.
  3. Enter the setup code in Apple Home or Google Home to link the hardware concurrently.

---

## 7. Bundled Agent Tooling & Python CLI Controller

Use the built-in diagnostic and management controller located at `.skills/smart-home/scripts/smart_home_client.py`:

```bash
# 1. Connection and diagnostic health check
python .skills/smart-home/scripts/smart_home_client.py status

# 2. List all entities by category
python .skills/smart-home/scripts/smart_home_client.py list --domain switch

# 3. Read specific entity state
python .skills/smart-home/scripts/smart_home_client.py get sensor.living_room_temperature

# 4. Execute atomic device control service
python .skills/smart-home/scripts/smart_home_client.py call light turn_off \
  --data '{"entity_id": "light.office_desk_lamp"}'

# 5. Export comprehensive schema dictionary for agent reasoning
python .skills/smart-home/scripts/smart_home_client.py export -o smart_home_schema.json
```

---

## 8. Physical Environment Safeguards & HITL Policies

Because smart home commands actuate physical appliances, AI agents must enforce safety protocols:

* **Read-Before-Write Invariant**: Always inspect current entity state and availability before dispatching state-mutating commands.
* **Perimeter Security Human Confirmation (HITL)**: Never autonomously execute commands targeting door locks (`lock.unlock`), garage doors (`cover.open_cover`), security gates, or alarm control panels (`alarm_control_panel.disarm`) without explicit, interactive confirmation from the user.
* **Thermostat Boundaries**: Restrict automated temperature setpoints within reasonable human-comfort ranges (e.g. 60°F to 80°F / 15°C to 27°C) to prevent equipment freezing or overheating.
* **Debounce and Rate Limiting**: Avoid high-frequency service loops. Enforce a minimum 2-second debounce between repeated commands to physical relays and smart bulbs.

* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
