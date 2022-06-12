import { memo, useEffect, useState } from "react";
import { View, Image, Label } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { pictures } from "./../util";
import "./index.scss";

type Props = {
  message: any;
};

export default memo<Props>(({ message }) => {
  const [show, setShow] = useState(false);
  const [filePayload, setFilePayload] = useState<{
    fileUrl: string;
    fileName: string;
  }>({ fileName: "", fileUrl: "" });

  useEffect(() => {
    if (message) {
      setFilePayload(message.payload);
    }
  }, [message]);

  const downloadConfirm = (e) => {
    e.stopPropagation();
    Taro.downloadFile({
      url: filePayload.fileUrl,
      success(res) {
        const filePath = res.tempFilePath;
        Taro.openDocument({
          filePath,
          success() {},
        });
      },
    });
  };

  return (
    <>
      <View className="TUI-fileMessage">
        <View className="fileMessage">
          <View className="fileMessage-box">
            <Image className="file-icon" src={pictures.file} />
            <Label onClick={() => setShow(true)} className="file-title">
              {filePayload.fileName}
            </Label>
          </View>
        </View>
      </View>
      {show && (
        <View className="pop">
          <View className="text-box">
            <text className="download-confirm" onClick={downloadConfirm}>
              下载
            </text>
          </View>
          <View className="text-box">
            <text className="abandon" onClick={() => setShow(false)}>
              取消
            </text>
          </View>
        </View>
      )}
    </>
  );
});
