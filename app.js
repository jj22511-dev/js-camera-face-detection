let App = {
	videoTag: document.querySelector('#video-tag'),
	webCamSwitch: document.querySelector("#webcam-start"),
	parentContainer: document.querySelector('.container'),

	init() {
		this.webCamSwitch.addEventListener('click', App.events.onToggleWebCam);
		this.videoTag.addEventListener('play', App.events.onPlayVideo);
	}
}

App.events = {
	onToggleWebCam: function(event) {
		event.preventDefault();
		App.funcs.loadFaceApiModels().then((res) => {
			App.funcs.startFaceTracking();
			this.style.display = "none"; 
		}).catch((err) => {
			console.error(err)
		});
	},

	onPlayVideo(event) {
		const detectionCanvas = faceapi.createCanvasFromMedia(App.videoTag);
		const detectionCanvasContext = detectionCanvas.getContext('2d');
		const videoDisplay = {
			width: App.videoTag.width,
			height: App.videoTag.height
		}

		App.parentContainer.append(detectionCanvas);
		faceapi.matchDimensions(detectionCanvas, videoDisplay);

		setInterval(async() => {
			const detections = await faceapi.detectAllFaces(App.videoTag, new faceapi.TinyFaceDetectorOptions())
					.withFaceLandmarks()
					.withFaceExpressions();

			const resizedDetections = faceapi.resizeResults(detections, videoDisplay);

			detectionCanvasContext.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height);
			
			faceapi.draw.drawDetections(detectionCanvas, resizedDetections);
			faceapi.draw.drawFaceLandmarks(detectionCanvas, resizedDetections);
			faceapi.draw.drawFaceExpressions(detectionCanvas, resizedDetections);
		}, 100);
	}
};

App.funcs = {
	loadFaceApiModels() {
		return new Promise((resolve, reject) => {
			const models = [
				faceapi.nets.tinyFaceDetector.loadFromUri('models/tiny_face_detector'),
				faceapi.nets.faceLandmark68Net.loadFromUri('models/face_landmark_68'),
				faceapi.nets.faceExpressionNet.loadFromUri('models/face_expression'),
			];
			Promise.all(models).then(resolve).catch(reject);
		});
	},

	startFaceTracking() {
		const mediaStreamConstraints = { video: true, audio: true };
		const promise = navigator.mediaDevices.getUserMedia(mediaStreamConstraints);

		promise.then(stream => {
			App.videoTag.srcObject = stream;
		}).catch(error => {
			console.log(error);
		});
	}
}

App.init();

