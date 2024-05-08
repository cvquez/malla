import {Controller} from "@hotwired/stimulus"

export default class extends Controller {
    static targets = ["container"];

    toggleFullscreen() {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.requestFullscreen();
        }
    }

    requestFullscreen() {
        if (this.containerTarget.requestFullscreen) {
            this.containerTarget.requestFullscreen();
        } else if (this.containerTarget.mozRequestFullScreen) {
            this.containerTarget.mozRequestFullScreen();
        } else if (this.containerTarget.webkitRequestFullscreen) {
            this.containerTarget.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (this.containerTarget.msRequestFullscreen) {
            this.containerTarget.msRequestFullscreen();
        }
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    get isFullscreen() {
        return !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
    }
}
