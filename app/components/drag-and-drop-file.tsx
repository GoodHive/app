import { useEffect, useRef } from "react";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import FileData from "@interfaces/file-data";

interface Props {
  setFile: (file: FileData | false) => void;
  file: FileData | false;
  isRenderedPage: boolean;
  setIsRenderedPage: (isRenderedPage: boolean) => void;
  invoiceInputValue: React.Ref<HTMLInputElement>;
}

const DragAndDropFile = ({
  setFile,
  file,
  isRenderedPage,
  setIsRenderedPage,
  invoiceInputValue,
}: Props) => {
  const DEFAULT_SCALE = 0.2;
  const pageRenderRef = useRef(null);

  const NEXT_PUBLIC_UPLOAD_PROFILE_IMAGE_SIZE_LIMIT_MB =
    process.env.NEXT_PUBLIC_UPLOAD_PROFILE_IMAGE_SIZE_LIMIT_MB || 10;

  const validTypes = ["image/jpeg", "image/jpg", "image/png"];

  type AssetData = string;

  const showAssetInCanvas = (assetData: AssetData): void => {
    const img: HTMLImageElement = new Image();
    img.src = assetData;

    img.onload = (): void => {
      const canvas: HTMLCanvasElement = document.createElement("canvas");
      const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");

      canvas.height = img.height;
      canvas.width = img.width;

      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }

      setIsRenderedPage(true);
    };
  };

  const onFileUpload = async (file: File): Promise<void | false> => {
    if (!file) return;

    setIsRenderedPage(false);
    const reader = new FileReader();

    const { size, type, name } = file;

    setFile(false);

    // TODO: move errors files to the modal errors
    if (validTypes.indexOf(type) === -1) {
      alert("File extension is not valid");

      return false;
    }

    if (
      size / 1024 / 1024 >
      Number(`${process.env.NEXT_PUBLIC_UPLOAD_PROFILE_IMAGE_SIZE_LIMIT_MB}`)
    ) {
      alert(
        `File size exceeded the limit of ${process.env.NEXT_PUBLIC_UPLOAD_PG_SIZE_LIMIT_MB}MB`
      );

      return false;
    }

    reader.readAsDataURL(file);
    reader.onload = (loadEvt: ProgressEvent<FileReader>) => {
      if (loadEvt.target && typeof loadEvt.target.result === "string") {
        setFile({ name, type, data: loadEvt.target.result });
        showAssetInCanvas(loadEvt.target.result);
      }
    };
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const {
      dataTransfer: { files },
    } = e;
    const { length } = files;

    if (length === 0) return false;

    onFileUpload(files[0]);
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>) =>
    e.preventDefault();
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFileUpload(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (file && typeof file !== "boolean" && file.data) {
      setIsRenderedPage(false);
    }
  }, [file, setIsRenderedPage]);

  return (
    <div
      className="relative h-[230px] w-[230px] flex items-center mt-10 justify-center cursor-pointer bg-gray-100"
      style={{
        clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
      }}
    >
      <input
        accept={validTypes.toString()}
        id="file-upload"
        name="file-upload"
        type="file"
        className="absolute top-0 bottom-0 left-0 right-0 w-full h-full opacity-0 cursor-pointer"
        ref={invoiceInputValue}
        onChange={changeHandler}
      />
      {file ? (
        <div
          onDrop={(e: React.DragEvent<HTMLDivElement>) => onDrop(e)}
          onDragOver={(e: React.DragEvent<HTMLDivElement>) => onDragOver(e)}
          className="flex"
        >
          {isRenderedPage && typeof file.data === "string" ? (
            <img className="object-cover" src={file.data} />
          ) : (
            // TODO: fix this skeleton
            <Skeleton height="100px" />
          )}
        </div>
      ) : (
        <div
          onDrop={(e: React.DragEvent<HTMLDivElement>) => onDrop(e)}
          onDragOver={(e: React.DragEvent<HTMLDivElement>) => onDragOver(e)}
          className="flex mt-[-20px]"
        >
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto text-gray-600"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex flex-col text-sm text-gray-600">
              <div>
                <span className="font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                  Upload a file
                </span>
              </div>
              <div>
                <p>or drag and drop</p>
              </div>
            </div>
            <p className="pt-1 text-xs text-gray-500">
              PNG, JPG up to {NEXT_PUBLIC_UPLOAD_PROFILE_IMAGE_SIZE_LIMIT_MB}Mb
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragAndDropFile;
