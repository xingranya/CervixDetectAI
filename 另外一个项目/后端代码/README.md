{
  "ApplicationSettings": {
    "ApplicationName": "宫颈病变智能风险评估系统",
    "Version": "1.0.0",
    "MaxImageSize": 4096,
    "SupportedFormats": [".jpg", ".jpeg", ".png", ".tiff", ".bmp"]
  },
  "ModelSettings": {
    "SegmentationModelPath": "models\\lesion_segmentation.onnx",
    "ClassificationModelPath": "models\\risk_classification.onnx",
    "ModelInputSize": 512,
    "ConfidenceThreshold": 0.7
  },
  "ImageProcessing": {
    "PreprocessingEnabled": true,
    "ContrastEnhancement": true,
    "NoiseReduction": true,
    "NormalizationMethod": "Standardization"
  },
  "DatabaseSettings": {
    "ConnectionString": "Server=(local);Database=CervicalLesionDB;Trusted_Connection=True;",
    "EnableLogging": true,
    "MaxRetryCount": 3
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "System": "Warning"
    },
    "FileLogging": {
      "Enabled": true,
      "FilePath": "logs\\application.log",
      "MaxFileSize": 10485760,
      "RetainedFileCount": 10
    }
  }
}