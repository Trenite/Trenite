export default class isMobile {
	static Android() {
		return navigator.userAgent.match(/Android/i);
	}
	static BlackBerry() {
		return navigator.userAgent.match(/BlackBerry/i);
	}
	static iOS() {
		return navigator.userAgent.match(/iPhone|iPad|iPod/i);
	}
	static Opera() {
		return navigator.userAgent.match(/Opera Mini/i);
	}
	static Windows() {
		return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
	}
	static any() {
		return this.Android() || this.BlackBerry() || this.iOS() || this.Opera() || this.Windows();
	}
}
