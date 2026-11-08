import { BrowserQRCodeReader } from '@zxing/browser'
export async function startQR(video:HTMLVideoElement,onValue:(value:string)=>void){const reader=new BrowserQRCodeReader(undefined,{delayBetweenScanAttempts:250,delayBetweenScanSuccess:700});return reader.decodeFromConstraints({video:{facingMode:{ideal:'environment'}},audio:false},video,result=>{if(result)onValue(result.getText())})}
export async function decodeQRImage(file:File){const url=URL.createObjectURL(file);try{return (await new BrowserQRCodeReader().decodeFromImageUrl(url)).getText()}finally{URL.revokeObjectURL(url)}}
