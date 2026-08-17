#!/usr/bin/env python3
"""
====================================================================
La Visual MK - Servidor Local de Conversión de YouTube a MP3
====================================================================

Requisitos en tu PC:
  1. Instalar dependencias en la terminal:
       pip install -U yt-dlp flask flask-cors

  2. Tener instalado ffmpeg en tu sistema (si no lo tienes: choco install ffmpeg / brew install ffmpeg / descargar de https://ffmpeg.org/)

  3. Ejecutar con doble clic: iniciar_servidor_mp3.bat o en consola: python yt2mp3_server.py

Abre http://127.0.0.1:5057 en tu navegador para descargar MP3 directamente a tu PC.
"""

import os
import re
import tempfile
import sys
from pathlib import Path
from flask import Flask, request, send_file, jsonify, render_template_string
from flask_cors import CORS

try:
    import yt_dlp
except ImportError:
    print("\n[!] ERROR: 'yt-dlp' no está instalado. Ejecuta: pip install -U yt-dlp flask flask-cors\n")
    sys.exit(1)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.after_request
def add_cors_pna_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, *"
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition, X-Audio-Title"
    return response

def sanitize_filename(name):
    clean = re.sub(r'[^\w\s-]', '', name).strip()
    return re.sub(r'[-\s]+', '_', clean).lower()

HTML_PAGE = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>La Visual MK - Descargador Local MP3</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen p-4 font-sans">
  <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
    <div class="flex items-center gap-3 border-b border-slate-800 pb-4">
      <div class="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-500 flex items-center justify-center text-xl font-bold">🎵</div>
      <div>
        <h1 class="text-base font-bold text-white">La Visual MK • MP3 Local</h1>
        <p class="text-xs text-slate-400">Servidor en tu PC (Puerto 5057)</p>
      </div>
    </div>

    <form action="/download" method="GET" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Pega el enlace de YouTube:</label>
        <input 
          type="url" 
          name="url" 
          required 
          placeholder="https://www.youtube.com/watch?v=..." 
          class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
        />
      </div>

      <button 
        type="submit" 
        class="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-rose-600/20"
      >
        <span>Descargar MP3 a tu PC</span>
        <span>⬇</span>
      </button>
    </form>

    <div class="text-[11px] text-slate-400 bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
      <p class="font-semibold text-slate-300">💡 Instrucciones:</p>
      <ol class="list-decimal list-inside space-y-1 text-slate-400">
        <li>Pega el link y pulsa <b>Descargar MP3</b>.</li>
        <li>Una vez descargado el archivo, ve a la app y pulsa <b>"Subir MP3 / Audio desde tu PC"</b>.</li>
      </ol>
    </div>
  </div>
</body>
</html>
"""

@app.route('/', methods=['GET'])
def index():
    return render_template_string(HTML_PAGE)

@app.route('/health', methods=['GET', 'OPTIONS'])
def health():
    if request.method == 'OPTIONS':
        return ('', 204)
    return jsonify({
        "status": "ok",
        "service": "La Visual MK - YT2MP3 Local Server",
        "port": 5057
    })

@app.route('/download', methods=['GET'])
def download_get():
    url = request.args.get('url', '').strip()
    if not url:
        return "Por favor ingresa una URL válida.", 400
    return process_video(url)

@app.route('/convert', methods=['POST', 'OPTIONS'])
def convert_to_mp3():
    if request.method == 'OPTIONS':
        return ('', 204)

    data = request.get_json(silent=True) or {}
    url = data.get('url', '').strip()
    if not url:
        return jsonify({"error": "Por favor proporciona una URL de YouTube válida."}), 400

    return process_video(url)

def process_video(url):
    temp_dir = tempfile.mkdtemp(prefix="lavisualmk_yt_")
    out_template = os.path.join(temp_dir, '%(title)s.%(ext)s')

    # Configuración anti-bloqueo 403 Forbidden con extractor args y player_client múltiple
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': out_template,
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'web_creator', 'ios', 'web'],
                'player_skip': ['webpage', 'configs'],
            }
        },
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
        },
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': False,
        'no_warnings': False,
        'nocheckcertificate': True,
    }

    try:
        print(f"[*] Descargando y convirtiendo audio desde: {url}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            raw_title = info.get('title', 'youtube_audio')
            clean_title = sanitize_filename(raw_title)

        generated_files = [f for f in os.listdir(temp_dir) if f.endswith('.mp3')]
        if not generated_files:
            return jsonify({"error": "No se pudo extraer el audio MP3. Verifica que ffmpeg esté instalado."}), 500

        mp3_path = os.path.join(temp_dir, generated_files[0])
        final_filename = f"{clean_title}.mp3"
        print(f"[✓] Audio generado exitosamente: {final_filename}")

        return send_file(
            mp3_path,
            as_attachment=True,
            download_name=final_filename,
            mimetype="audio/mpeg"
        )
    except Exception as e:
        print(f"[!] Error en la conversión: {str(e)}")
        return jsonify({
            "error": f"Error al procesar el video: {str(e)}",
            "solucion": "Ejecuta: pip install -U yt-dlp"
        }), 500

if __name__ == '__main__':
    print("=========================================================")
    print(" 🎵 La Visual MK - Servidor Local YouTube -> MP3")
    print(" Escuchando en:")
    print("   -> http://localhost:5057")
    print("   -> http://127.0.0.1:5057")
    print(" Mantén esta ventana abierta mientras usas el panel de Música.")
    print("=========================================================")
    app.run(host='0.0.0.0', port=5057, debug=False)
