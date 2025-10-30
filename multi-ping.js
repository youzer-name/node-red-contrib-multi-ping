module.exports = function(RED) {
    const ping = require('ping');

    function MultiPingNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.name = config.name;
        node.host = config.host;
        node.mode = config.mode || 'anyup';
        node.timer = Number(config.timer) || 0;
    node.maxAttempts = Number(config.maxAttempts) || 1;
    node.timeout = Number(config.timeout) || 2;
        let interval = null;

        function parseHosts(hosts) {
            return hosts.split(',').map(h => h.trim()).filter(Boolean);
        }

        async function doPing(hosts, mode, send, done) {
            let results = [];
            let status = null;
            let upCount = 0;
            let downCount = 0;
            let checked = new Array(hosts.length).fill(false);
            let breakIndex = hosts.length;
            for (let i = 0; i < hosts.length; i++) {
                let alive = false;
                let attempt = 0;
                let error = false;
                for (attempt = 0; attempt < node.maxAttempts; attempt++) {
                    try {
                        let res = await ping.promise.probe(hosts[i], { timeout: node.timeout });
                        if (res.alive) {
                            alive = true;
                            break;
                        }
                    } catch (err) {
                        error = true;
                        // If error, treat as down and break
                        break;
                    }
                }
                results.push({ host: hosts[i], alive: error ? false : (alive ? true : false) });
                checked[i] = true;
                if (alive) upCount++;
                else downCount++;
                if (mode === 'anyup' && alive) {
                    status = 'up';
                    breakIndex = i + 1;
                    break;
                }
                if (mode === 'anydown' && !alive) {
                    status = 'down';
                    breakIndex = i + 1;
                    break;
                }
            }
            // For 'any' modes, fill in skipped hosts with alive: null
            if (mode === 'anyup' || mode === 'anydown') {
                for (let i = breakIndex; i < hosts.length; i++) {
                    results.push({ host: hosts[i], alive: null });
                }
            }
            if (!status) {
                if (mode === 'anyup') status = 'down';
                else if (mode === 'anydown') status = 'up';
                else if (mode === 'allup') status = (upCount === hosts.length) ? 'up' : 'down';
                else if (mode === 'alldown') status = (downCount === hosts.length) ? 'down' : 'up';
            }
            node.status({ fill: status === 'up' ? 'green' : 'red', shape: 'dot', text: status });
            send({ payload: { status, results } });
            if (done) done();
        }

        function triggerPing(send, done) {
            const hosts = parseHosts(node.host);
            if (!hosts.length) {
                node.status({ fill: 'grey', shape: 'ring', text: 'no hosts' });
                if (done) done();
                return;
            }
            doPing(hosts, node.mode, send, done);
        }

        if (node.timer > 0) {
            interval = setInterval(() => {
                triggerPing(node.send.bind(node));
            }, node.timer * 1000);
            node.on('close', function() {
                if (interval) clearInterval(interval);
            });
        }

        node.on('input', function(msg, send, done) {
            triggerPing(send, done);
        });
    }

    RED.nodes.registerType('multi-ping', MultiPingNode);
};
