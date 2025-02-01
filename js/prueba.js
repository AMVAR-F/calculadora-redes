const workspace = document.getElementById('workspace');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let connections = [];
let packets = [];

canvas.width = workspace.clientWidth;
canvas.height = workspace.clientHeight;

// Habilitar arrastrar los dispositivos
document.querySelectorAll('.device').forEach(device => {
    device.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', e.target.id));
});

workspace.addEventListener('dragover', e => e.preventDefault());

workspace.addEventListener('drop', e => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');

    if (id === "cable") {
        let closestDevice = findClosestDevice(e.offsetX, e.offsetY);
        if (closestDevice) {
            if (connections.length === 0 || connections[0] !== closestDevice) {
                connections.push(closestDevice);
            }
        }

        if (connections.length === 2) {
            drawConnections(connections[0], connections[1]);
            connections = []; // Reiniciar conexiones
        }
    } else {
        const newDevice = document.getElementById(id).cloneNode(true);
        newDevice.style.position = 'absolute';
        newDevice.style.left = `${e.offsetX}px`;
        newDevice.style.top = `${e.offsetY}px`;

        if (id === "router") {
            showRouterConfig(newDevice);
        } else {
            newDevice.dataset.ip = generateIP();
        }

        workspace.appendChild(newDevice);
    }
});

// Mostrar formulario de configuración del router
function showRouterConfig(router) {
    document.getElementById('config-dialog').style.display = 'block';
    
    document.getElementById('save-config').onclick = () => {
        router.dataset.ip = document.getElementById('router-ip').value;
        router.dataset.mask = document.getElementById('router-mask').value;
        document.getElementById('config-dialog').style.display = 'none';
        alert(`Router configurado con IP ${router.dataset.ip}`);
    };
}

// Generar direcciones IP dentro de la misma subred del router
function generateIP() {
    let router = document.querySelector('#workspace #router');
    let baseIP = router ? router.dataset.ip.split('.').slice(0, 3).join('.') : "192.168.1";
    return `${baseIP}.${Math.floor(Math.random() * 254) + 1}`;
}

// Encontrar el dispositivo más cercano al soltar un cable
function findClosestDevice(x, y) {
    let devices = document.querySelectorAll('#workspace .device');
    let minDistance = Infinity;
    let closest = null;

    devices.forEach(device => {
        let rect = device.getBoundingClientRect();
        let centerX = rect.left + rect.width / 2;
        let centerY = rect.top + rect.height / 2;
        let distance = Math.hypot(centerX - x, centerY - y);

        if (distance < minDistance) {
            minDistance = distance;
            closest = device;
        }
    });

    return closest;
}

// Dibujar conexión entre dispositivos
function drawConnections(device1, device2) {
    let rect1 = device1.getBoundingClientRect();
    let rect2 = device2.getBoundingClientRect();
    
    ctx.beginPath();
    ctx.moveTo(rect1.left + rect1.width / 2, rect1.top + rect1.height / 2);
    ctx.lineTo(rect2.left + rect2.width / 2, rect2.top + rect2.height / 2);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Iniciar simulación
document.getElementById('play').addEventListener('click', () => {
    packets = [];
    let devices = document.querySelectorAll('#workspace .device');

    devices.forEach(device => {
        if (device.id !== 'router') {
            packets.push({
                x: device.offsetLeft,
                y: device.offsetTop,
                targetX: findDevice('server').offsetLeft,
                targetY: findDevice('server').offsetTop,
                color: 'blue',
                sourceIP: device.dataset.ip
            });
        }
    });

    animatePackets();
});

// Detener simulación
document.getElementById('stop').addEventListener('click', () => {
    packets = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    alert("Simulación detenida.");
});

// Animar los paquetes de datos
function animatePackets() {
    if (packets.length === 0) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    packets.forEach(packet => {
        ctx.beginPath();
        ctx.arc(packet.x, packet.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = packet.color;
        ctx.fill();

        if (packet.x < packet.targetX) packet.x += 2;
        if (packet.y < packet.targetY) packet.y += 2;

        if (Math.abs(packet.x - packet.targetX) < 5 && Math.abs(packet.y - packet.targetY) < 5) {
            packet.color = 'red';
            let source = findDeviceByIP(packet.sourceIP);
            packet.targetX = source.offsetLeft;
            packet.targetY = source.offsetTop;
        }
    });

    requestAnimationFrame(animatePackets);
}

// Encontrar un dispositivo por tipo (ej. router o server)
function findDevice(type) {
    return document.querySelector(`#workspace #${type}`);
}

// Encontrar un dispositivo por dirección IP
function findDeviceByIP(ip) {
    return [...document.querySelectorAll('#workspace .device')].find(device => device.dataset.ip === ip);
}
