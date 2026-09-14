// Declarative BuildKit Multi-Architecture Matrix Configuration
group "default" {
  targets = ["server"]
}

target "server" {
  context = "."
  dockerfile = "Dockerfile"
  platforms = ["linux/amd64", "linux/arm64"]
  tags = [
    "registry.example.com/app:latest",
    "registry.example.com/app:v1.0.0"
  ]
  cache-from = [
    "type=registry,ref=registry.example.com/app:buildcache"
  ]
  cache-to = [
    "type=registry,ref=registry.example.com/app:buildcache,mode=max"
  ]
  args = {
    BUILDKIT_INLINE_CACHE = "1"
  }
}
