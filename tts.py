"""TTS endpoint — uses MioTTS-0.1B (human-sounding, runs locally)."""

from fastapi import APIRouter, Query
from fastapi.responses import Response
import httpx
import json

router = APIRouter()

MIOTTS_URL = "http://localhost:8001/v1/tts"


@router.get("/tts")
async def text_to_speech(
    text: str = Query(..., description="Text to speak"),
    voice: str = Query("en_female", description="Voice preset (en_female, en_male)"),
):
    """Generate human-sounding speech using MioTTS-0.1B."""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                MIOTTS_URL,
                json={
                    "text": text[:500],
                    "reference": {"type": "preset", "preset_id": voice},
                    "output": {"format": "wav"},
                },
            )

            if resp.status_code == 200:
                # Response is WAV audio
                return Response(
                    content=resp.content,
                    media_type="audio/wav",
                    headers={
                        "Cache-Control": "no-cache",
                        "Access-Control-Allow-Origin": "*",
                    },
                )
            else:
                raise Exception(f"MioTTS returned {resp.status_code}")

    except Exception as e:
        # Fallback to espeak-ng
        import subprocess
        try:
            result = subprocess.run(
                ["espeak-ng", "-v", "mb-us2", "-s", "140", "-p", "50", "-w", "/dev/stdout", text[:1000]],
                capture_output=True,
                timeout=15,
            )
            return Response(
                content=result.stdout,
                media_type="audio/wav",
                headers={"Cache-Control": "no-cache", "Access-Control-Allow-Origin": "*"},
            )
        except:
            return Response(
                content=f"TTS error: {str(e)}".encode(),
                status_code=500,
            )


@router.get("/tts/health")
async def tts_health():
    """Check if MioTTS server is running."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get("http://localhost:8001/health")
            if resp.status_code == 200:
                return {"status": "ok", "engine": "miotts-0.1b"}
    except:
        pass
    return {"status": "fallback", "engine": "espeak-ng"}
