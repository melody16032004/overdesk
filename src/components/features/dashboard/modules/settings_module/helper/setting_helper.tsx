export const compressImageSmart = (
  file: File,
  quality = 0.85,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Giới hạn Full HD là đủ nét cho hầu hết màn hình
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        // Chỉ resize nếu ảnh lớn hơn giới hạn
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          } else {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Không thể tạo Canvas Context"));
          return;
        }

        // Dùng thuật toán nội suy chất lượng cao để giữ nét khi resize
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx?.drawImage(img, 0, 0, width, height);

        // Nén với chất lượng cao (0.85)
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const getBase64Size = (base64String: string) => {
  const padding = (base64String.match(/=/g) || []).length;
  return (base64String.length * 3) / 4 - padding;
};

export const resizeCursorImage = (
  source: File | string,
  size: number,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Tránh lỗi CORS nếu ảnh từ nguồn ngoài

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.clearRect(0, 0, size, size); // Xóa nền trong suốt
        // Vẽ ảnh lên canvas với kích thước mới
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Canvas context error"));
      }
    };

    img.onerror = (err) => reject(err);

    // Logic xử lý đầu vào
    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(source);
    } else {
      // Nếu là string (base64 từ store), gán trực tiếp
      img.src = source;
    }
  });
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
