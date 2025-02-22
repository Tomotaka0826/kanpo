require 'stripe'
require 'sinatra'
require 'json'
require 'dotenv/load'

# テスト用のAPIキーに変更
Stripe.api_key = 'sk_test_51QupnIJiZkSZSi89mc0WGcr47a4sbej2uEfqnhJWX0byB4W8SgNpJ3QFS1UhXMyUF0nUZpTVITjSh3Jy2DmrB6An00VohY1azE'

set :static, true
set :port, 4242
set :public_folder, 'public'

YOUR_DOMAIN = 'http://localhost:4242'

# 商品IDの定義
PRODUCTS = {
  '良温茶' => 'prod_RoZQTiPC35unNq',
  '産後茶' => 'prod_RoZQAfEwY2PRpa',
  '参鶏湯' => 'prod_Roo9UiTsemshsJ',
  '漢方ブレンド茶' => 'prod_RooBcXwYKvvkkW'
}

# セキュリティヘッダーの設定
before do
  headers 'X-Frame-Options' => 'DENY'
  headers 'X-Content-Type-Options' => 'nosniff'
  headers 'X-XSS-Protection' => '1; mode=block'
end

# CORSの設定
before do
  response.headers['Access-Control-Allow-Origin'] = '*'
  response.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
  response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
end

post '/create-checkout-session' do
  content_type 'application/json'

  begin
    payload = JSON.parse(request.body.read)
    items = payload['items']

    session = Stripe::Checkout::Session.create({
      line_items: items.map { |item|
        {
          price_data: {
            currency: 'jpy',
            product: PRODUCTS[item['name']],
            unit_amount: item['price']
          },
          quantity: 1
        }
      },
      mode: 'payment',
      success_url: YOUR_DOMAIN + '/success.html',
      cancel_url: YOUR_DOMAIN + '/cancel.html',
      automatic_tax: {enabled: true},
    })

    redirect session.url, 303
  rescue => e
    status 500
    { error: e.message }.to_json
  end
end 