import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

const tunnelUrl = 'https://madhurai-chocolate.onrender.com';
const wifiUrl = 'http://192.168.0.101:3000';

async function run() {
  console.log('Generating QR assets...');

  // 1. Data URLs
  const tunnelDataUrl = await QRCode.toDataURL(tunnelUrl, {
    width: 600,
    margin: 2,
    color: { dark: '#2D150B', light: '#FFFFFF' }
  });

  // 2. Write PNGs
  const pngOutputs = [
    path.join(projectRoot, 'customer-web/public/customer_qr_tunnel.png'),
    path.join(projectRoot, 'customer-web/public/customer_qr_online.png'),
    path.join(projectRoot, 'customer-web/public/customer_qr_wifi.png'),
    path.join(projectRoot, 'customer-web/dist/customer_qr_tunnel.png'),
    path.join(projectRoot, 'customer-web/dist/customer_qr_online.png'),
    path.join(projectRoot, 'customer-web/dist/customer_qr_wifi.png'),
  ];

  for (const pngPath of pngOutputs) {
    const isWifi = pngPath.includes('wifi');
    const url = isWifi ? wifiUrl : tunnelUrl;
    const dir = path.dirname(pngPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await QRCode.toFile(pngPath, url, {
      width: 600,
      margin: 2,
      color: { dark: '#2D150B', light: '#FFFFFF' }
    });
    console.log('Generated:', pngPath);
  }

  // 3. Update customer_store_qr_card.svg
  const svgTargets = [
    path.join(projectRoot, 'customer-web/public/customer_store_qr_card.svg'),
    path.join(projectRoot, 'customer-web/dist/customer_store_qr_card.svg')
  ];

  for (const svgTarget of svgTargets) {
    if (fs.existsSync(svgTarget)) {
      let content = fs.readFileSync(svgTarget, 'utf8');
      content = content.replace(/<image href="[^"]*"/, `<image href="${tunnelDataUrl}"`);
      content = content.replace(/http:\/\/192\.168\.0\.101:3000/g, tunnelUrl);
      fs.writeFileSync(svgTarget, content, 'utf8');
      console.log('Updated SVG:', svgTarget);
    }
  }

  console.log('Finished updating QR assets successfully!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
