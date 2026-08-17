#!/usr/bin/env python3
"""
====================================================================
La Visual MK - Servidor Local de Conversión de YouTube a MP3
====================================================================

Requisitos previos en tu PC:
  1. Instalar dependencias con terminal / consola:
       pip install flask flask-cors yt-dlp

  2. Tener instalado ffmpeg en tu sistema (si no lo tienes, puedes descargarlo de https://ffmpeg.org/ o con 'choco install ffmpeg' / 'brew install ffmpeg')

  3. Ejecutar este script:
       python yt2mp3_server.py

El servidor se iniciará en: http://localhost:5057 y http://127.0.0.1:5057
La aplicación web La Visual MK se conectará automáticamente a este puerto.
"""

import os
import re
import tempfile
import sys
from pathlib import Path
from flask import Flask, request, send_file, jsonify, make_response
from flask_cors import CORS

try:
    import yt_dlp
except ImportError:
    print("\n[!] ERROR: 'yt-dlp' no está instalado. Ejecuta en tu terminal: pip install yt-dlp flask flask-cors\n")
    sys.exit(1)

app = Flask(__name__)
# Habilitar CORS para permitir peticiones desde la aplicación web
CORS(app, resources={r"/*": {"origins": "*"}})

# Agregar encabezados de Private Network Access (PNA) para Chrome / Edge / Brave
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

@app.route('/health', methods=['GET', 'OPTIONS'])
def health():
    if request.method == 'OPTIONS':
        return ('', 204)
    return jsonify({
        "status": "ok",
        "service": "La Visual MK - YT2MP3 Local Server",
        "port": 5057
    })

@app.route('/convert', methods=['POST', 'OPTIONS'])
def convert_to_mp3():
    if request.method == 'OPTIONS':
        return ('', 204)

    data = request.get_json(silent=True) or {}
    url = data.get('url', '').strip()

    if not url:
        return jsonify({"error": "Por favor proporciona una URL de YouTube válida."}), 400

    temp_dir = tempfile.mkdtemp(prefix="lavisualmk_yt_")
    out_template = os.path.join(temp_dir, '%(title)s.%(ext)s')

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': out_template,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': True,
        'no_warnings': True,
    }

    try:
        print(f"[*] Descargando y convirtiendo audio desde: {url}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            raw_title = info.get('title', 'youtube_audio')
            clean_title = sanitize_filename(raw_title)

        generated_files = [f for f in os.listdir(temp_dir) if f.endswith('.mp3')]
        if not generated_files:
            return jsonify({"error": "No se pudo extraer el audio MP3. Verifica que ffmpeg esté instalado y configurado en tu PC."}), 500

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
        return jsonify({"error": f"Error al procesar el video: {str(e)}"}), 500

if __name__ == '__main__':
    print("=========================================================")
    print(" 🎵 La Visual MK - Servidor Local YouTube -> MP3")
    print(" Escuchando en:")
    print("   -> http://localhost:5057")
    print("   -> http://127.0.0.1:5057")
    print(" Mantén esta ventana abierta mientras usas el panel de Música.")
    print("=========================================================")
    app.run(host='0.0.0.0', port=5057, debug=False)
