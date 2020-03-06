function QrCode() {
	this.getQrCode = function(string) {
		var qr = (require('qrcode-npm')).qrcode(3, 'L');
		qr.addData(string);
		qr.make();
		return qr.createImgTag(4);
	};
}

module.exports = QrCode;