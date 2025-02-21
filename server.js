const express = require('express');
const stripe = require('stripe')('sk_live_51QupnIJiZkSZSi89yHYWHKqGzFbXXXXXXXXXXXXXX'); // 実際のシークレットキー
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = express();
const helmet = require('helmet');

// SSL証明書の設定
const options = {
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'private.key')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'certificate.crt')),
  ca: fs.readFileSync(path.join(__dirname, 'ssl', 'ca_bundle.crt'))
};

app.use(express.static('public'));
app.use(express.json());

// HTTPSリダイレクト
app.use((req, res, next) => {
  if (!req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// セキュリティヘッダーの設定
app.use(helmet());

// CORS設定
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://your-domain.com');
  res.header('Access-Control-Allow-Methods', 'GET,POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body;
    
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'jpy',
        product_data: {
          name: item.name,
        },
        unit_amount: item.price,
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/cart.html`,
    });

    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// HTTPSサーバーの起動
const httpsServer = https.createServer(options, app);
httpsServer.listen(443, () => {
  console.log('HTTPS Server running on port 443');
});

// HTTP -> HTTPSリダイレクト用のサーバー
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
  res.end();
}).listen(80); 