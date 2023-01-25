# Ripping videos from MV:
ffmpeg -y -i "https://assets.__SITE__.com/api/v1/assets/__UUID.m3u8" -c copy -f mpegts output.mp4
