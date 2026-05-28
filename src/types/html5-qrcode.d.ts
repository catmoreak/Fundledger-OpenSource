declare module "html5-qrcode" {
  export class Html5QrcodeScanner {
    constructor(elementId: string, config?: any, verbose?: boolean);
    render(onSuccess?: (decodedText: string) => void, onError?: (errorMessage: string) => void): void;
    clear(): Promise<void>;
  }

  export class Html5Qrcode {
    constructor(elementId: string);
    start(cameraIdOrConfig: any, config?: any, qrCodeSuccessCallback?: (decodedText: string) => void): Promise<void>;
    stop(): Promise<void>;
    clear(): void;
  }

  export default Html5QrcodeScanner;
}
