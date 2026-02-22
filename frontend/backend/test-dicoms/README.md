# DICOM CT Scan Test Files

## 🏥 Dataset Information

This directory should contain 10 real DICOM CT scan files:
- **6 files with lung nodules** (in `nodules/` folder)
- **4 benign files** (in `benign/` folder)

## 📥 How to Download Real DICOM Files

### Method 1: TCIA (The Cancer Imaging Archive) - FREE & RECOMMENDED

1. **Visit TCIA**: https://www.cancerimagingarchive.net/

2. **Download LIDC-IDRI Collection**:
   - Go to: https://wiki.cancerimagingarchive.net/display/Public/LIDC-IDRI
   - This dataset contains 1,018 lung CT scans with nodule annotations
   - Click "Download" and install NBIA Data Retriever
   - Search for: "LIDC-IDRI"
   - Download 10 sample cases

3. **Select Files**:
   - **With Nodules** (6 files): Look for cases with "nodule" in annotations
   - **Benign** (4 files): Look for cases marked as "benign" or "no nodules"

### Method 2: Direct Download Links (If Available)

Some public DICOM samples:
- MedPix: https://medpix.nlm.nih.gov/home
- Radiopaedia: https://radiopaedia.org/ (requires account)

## 🔍 File Organization

After downloading, organize files as follows:

\`\`\`
test-dicoms/
├── nodules/
│   ├── nodule-case-001.dcm  (Malignant nodule)
│   ├── nodule-case-002.dcm  (Suspicious nodule)
│   ├── nodule-case-003.dcm  (Spiculated nodule)
│   ├── nodule-case-004.dcm  (Large nodule >8mm)
│   ├── nodule-case-005.dcm  (Multiple nodules)
│   └── nodule-case-006.dcm  (Ground-glass nodule)
└── benign/
    ├── benign-case-001.dcm  (Clear lungs)
    ├── benign-case-002.dcm  (Calcified granuloma)
    ├── benign-case-003.dcm  (Small benign nodule)
    └── benign-case-004.dcm  (Post-inflammatory)
\`\`\`

## 📊 Expected Results

### Files with Nodules:
- **Diagnosis**: "Malignant Nodule Detected" or "Suspicious Nodule"
- **Confidence**: 60-95%
- **Risk Level**: Moderate to High
- **Nodule Count**: 1-5 nodules
- **Recommendations**: Biopsy, follow-up CT, specialist referral

### Benign Files:
- **Diagnosis**: "Benign Nodule" or "No Significant Findings"
- **Confidence**: 65-90%
- **Risk Level**: Low
- **Nodule Count**: 0-1 small nodules
- **Recommendations**: Routine screening, annual follow-up

## 🚀 Quick Start with TCIA

### Install NBIA Data Retriever:

1. Download: https://wiki.cancerimagingarchive.net/display/NBIA/Downloading+TCIA+Images
2. Install the application
3. Search for "LIDC-IDRI"
4. Download 10 cases (6 with nodules, 4 benign)
5. Move files to appropriate folders

### Using the Files:

\`\`\`bash
# Test with nodule case
curl -X POST http://localhost:5001/api/predict \
  -F "image=@nodules/nodule-case-001.dcm"

# Test with benign case
curl -X POST http://localhost:5001/api/predict \
  -F "image=@benign/benign-case-001.dcm"
\`\`\`

## 📚 Additional Resources

- **TCIA Website**: https://www.cancerimagingarchive.net/
- **LIDC-IDRI Collection**: https://wiki.cancerimagingarchive.net/display/Public/LIDC-IDRI
- **DICOM Viewer**: Use Weasis or 3D Slicer to view DICOM files
- **Nodule Annotations**: XML files included with LIDC-IDRI

## ⚠️ Important Notes

1. **Real Medical Data**: TCIA provides real anonymized CT scans
2. **Large Files**: DICOM files can be 50-200MB each
3. **Series**: Each case may have multiple slices (choose representative)
4. **Privacy**: All TCIA data is de-identified and publicly available
5. **Attribution**: Cite LIDC-IDRI if using for research

---

**Last Updated**: February 18, 2026
**Dataset**: LIDC-IDRI (Lung Image Database Consortium Image Collection)
**License**: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)
