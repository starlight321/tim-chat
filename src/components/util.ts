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
import location from "@/assets/location.png";
import mapMarker from "@/assets/map-marker.png";
import onlineService from "@/assets/online-service.svg";
import loading from "@/assets/loading.png";
import audioPlay from "@/assets/audio-play.gif";
import audioMsg from "@/assets/audio-msg.png";
import file from "@/assets/file.png";

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
  loading,
  audioPlay,
  audioMsg,
  file,
};

export enum ImErrorCode {
  DIRTY_WORDS_CODE = 80001,
  UPLOAD_FAIL_CODE = 6008,
  UPLOAD_COS_CODE = 2041,
  REQUEST_OVER_TIME_CODE = 2801,
  DISCONNECT_NETWORK_CODE = 2800,
}

export interface ChooseMedia {
  /** 本地临时文件路径 (本地路径) */
  tempFilePath: string
  /** 本地临时文件大小，单位 B */
  size: number
  /** 视频的时间长度 */
  duration: number
  /** 视频的高度 */
  height: number
  /** 视频的宽度 */
  width: number
  /** 视频缩略图临时文件路径 */
  thumbTempFilePath: string
}

interface ImageFile {
  /** 本地临时文件路径 */
  path: string
  /** 本地临时文件大小，单位 B */
  size: number
  /** 文件的 MIME 类型
   * @supported h5
   */
  type?: string
  /** 原始的浏览器 File 对象
   * @supported h5
   */
  originalFileObj?: File
}

export interface ChooseImage {
  tempFiles: ImageFile[];
  tempFilePaths: string[];
}
