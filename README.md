# node-red-contrib-multi-ping

A Node-RED node to ping multiple hosts.

I use this node to check whether a phone is reachable via either LAN or via VPN wtih a different IP on each network.

## Features
- Enter a comma-separated list of IPs or hostnames to ping
- Modes: Any Up, Any Down, All Up, All Down
- Set interval for automatic pinging (or 0 for manual)
- Set max attempts per host (1-10)
- Set timeout per ping (1-30 seconds)
- All fields have tooltips and validation
- Status and output reflect the selected mode
- Results array always includes all hosts (with null for skipped in 'any' modes)

## Usage
1. Add the node to your flow
2. Enter targets and select mode in the editor
3. Optionally set interval, max attempts, and timeout
4. Deploy and trigger as needed

## Output
- `msg.payload.status`: "up" or "down" based on the selected mode
- `msg.payload.results`: Array of `{ host, alive }` for each host. If a host was not checked (in 'any' modes), `alive` will be `null`.

## Installation
```
npm install node-red-contrib-multi-ping
```

## License
MIT
