const FILE_TYPE = 'video/webm';
const FRAME_RATE = 30;

function createFileRecorder(
  stream: MediaStream,
  mimeType: string,
  recName: string,
  sessionId: string,
  saveCb: Function
) {
  let ended = false;
  const start = new Date().getTime();

  let recordedChunks: BlobPart[] = [];
  const SAVE_INTERVAL_MS = 200;
  const mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = function (e) {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  function onEnd() {
    if (ended) return;

    ended = true;
    saveFile(recordedChunks, mimeType, start, recName, sessionId, saveCb);
    recordedChunks = [];
  }

  // sometimes we get race condition or the onstop won't trigger at all,
  // this is why we have to make it twice to make sure that stream is saved
  // plus we want to be able to handle both, native and custom button clicks
  mediaRecorder.stream.getTracks().forEach((track) => (track.onended = onEnd));
  mediaRecorder.onstop = () => {
    onEnd();
    mediaRecorder.stream.getTracks().forEach((track) => track.stop());
  };
  mediaRecorder.start(SAVE_INTERVAL_MS);

  return mediaRecorder;
}

function saveFile(
  recordedChunks: BlobPart[],
  mimeType: string,
  startDate: number,
  recName: string,
  sessionId: string,
  saveCb: Function
) {
  const saveObject = { name: recName, duration: new Date().getTime() - startDate, sessionId };

  const blob = new Blob(recordedChunks, {
    type: mimeType,
  });
  saveCb(saveObject, blob);

  const filename = recName + '.' + mimeType.split('/')[1];
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = filename;

  document.body.appendChild(downloadLink);
  downloadLink.click();

  URL.revokeObjectURL(downloadLink.href); // clear from memory
  document.body.removeChild(downloadLink);
}

async function recordScreen() {
  return await navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: { frameRate: FRAME_RATE },
    // potential chrome hack
    // @ts-ignore
    preferCurrentTab: true,
  });
}

/**
 * Creates a screen recorder that sends the media stream to MediaRecorder
 * which then saves the stream to a file.
 *
 * Supported Browsers:
 *
 *      Windows: Chrome v91+, Edge v90+ - FULL SUPPORT;
 *      *Nix: Chrome v91+, Edge v90+ - LIMITED SUPPORT - (audio only captured from current tab)
 *
 * @returns  a promise that resolves to a function that stops the recording
 */
export async function screenRecorder(recName: string, sessionId: string, saveCb: Function) {
  try {
    const stream = await recordScreen();
    const mediaRecorder = createFileRecorder(stream, FILE_TYPE, recName, sessionId, saveCb);

    return () => {
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    }
  } catch (e) {
    console.log(e);
  }
}

// NOT SUPPORTED:
// macOS:  chrome and edge only support capturing current tab's audio
// windows: chrome and edge supports all audio
// other: not supported
