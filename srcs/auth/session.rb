require 'sinatra'
require_relative 'config'
require 'json'
require 'oauth2'
require 'net/http'

# Abilita la gestione delle sessioni
enable :sessions
set :session_secret, SecureRandom.hex(64)

# Hash globale per memorizzare gli utenti in memoria (prova)
$users = {}

# Route principale (home)
get '/' do
  send_file File.join(__dir__, '/public/', 'index.html')
end

get '/auth/login' do
  if session[:access_token]
    content_type :json
    { authenticated: true }.to_json
  else
    redirect_uri = ENV['REDIRECT_URI']
    auth_url = CLIENT.auth_code.authorize_url(redirect_uri: redirect_uri)

    content_type :json
    { auth_url: auth_url }.to_json
  end
end

# Endpoint per verificare se l'utente è autenticato
get '/check_auth' do
  if session[:access_token]
    content_type :json
    { authenticated: true }.to_json
  else
    content_type :json
    { authenticated: false }.to_json
  end
end

get '/logout' do
  session.clear
  content_type :json
  { success: true }.to_json
end

get '/callback' do
  # Ottieni il codice di autorizzazione dalla query string
  code = params[:code]
  if code.nil? || code.empty?
    content_type :json
    { success: false, error: "No authorization code received" }.to_json
    return
  end
  redirect_uri = ENV['REDIRECT_URI']
  begin
    # Scambia il codice di autorizzazione per il token
    token = CLIENT.auth_code.get_token(code, redirect_uri: redirect_uri)
    session[:access_token] = token.token

    # Ora recuperiamo i dati dell'utente da 42
    uri = URI.parse("https://api.intra.42.fr/v2/me")
    request = Net::HTTP::Get.new(uri)
    request["Authorization"] = "Bearer #{token.token}"

    # Esegui la richiesta
    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(request) }

    if response.is_a?(Net::HTTPSuccess)
      user_data = JSON.parse(response.body)

      # Verifica se l'utente esiste nel nostro "database" (hash globale)
      user = find_or_create_user(user_data)

      # Puoi aggiungere logica per associare l'utente al suo account
      session[:user_id] = user[:id]  # Memorizza l'ID dell'utente nella sessione

      content_type :json
      { success: true, access_token: token.token, user: user_data }.to_json
    else
      content_type :json
      { success: false, error: "Failed to fetch user data", response: response.body }.to_json
    end
  rescue OAuth2::Error => e
    content_type :json
    { success: false, error: e.message, response: e.response.body }.to_json
  end
end

# Funzione per trovare o creare l'utente nel nostro "database" (hash globale)
def find_or_create_user(user_data)
  # Usa l'email come chiave unica per ogni utente
  user = $users[user_data['email']]
  if user.nil?
    # Se l'utente non esiste, crealo
    user = {
      id: SecureRandom.uuid,  # Usa un UUID per simulare un ID univoco
      email: user_data['email'],
      username: user_data['login'],
      full_name: user_data['name']
    }
    $users[user_data['email']] = user
  end
  user
end