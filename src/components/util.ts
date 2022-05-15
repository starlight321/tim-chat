import keyboard from "@/assets/keyboard.svg";
import audio from "@/assets/audio.svg";
import faceEmoji from "@/assets/face-emoji.svg";
import more from "@/assets/more.svg";
import sendImg from "@/assets/send-img.svg";
import msgError from "@/assets/msg-error.png";
import up from "@/assets/up.svg";
import down from "@/assets/down.svg";
import sendingAudio from "@/assets/sending-audio.png";
import starGray from "@/assets/star-grey.png";
import star from "@/assets/star.png";
import takePhoto from "@/assets/take-photo.svg";
import sendVideo from "@/assets/send-video.svg";
import play from "@/assets/play.svg";
import location from "@/assets/location.svg";
import mapMarker from "@/assets/map-marker.png";
import onlineService from "@/assets/online-service.svg";

export const pictures = {
  keyboard,
  audio,
  faceEmoji,
  more,
  sendImg,
  msgError,
  up,
  down,
  sendingAudio,
  star,
  takePhoto,
  sendVideo,
  play,
  location,
  mapMarker,
  starGray,
  onlineService,
};

export enum ImErrorCode {
  DIRTY_WORDS_CODE = 80001,
  UPLOAD_FAIL_CODE = 6008,
  REQUEST_OVER_TIME_CODE = 2081,
  DISCONNECT_NETWORK_CODE = 2800,
}