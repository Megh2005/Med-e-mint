import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MedicalDocumentNFTModule = buildModule("MedicalDocumentNFTModule", (m) => {
  const medicalDocumentNFT = m.contract("MedicalDocumentNFT", []);

  return { medicalDocumentNFT };
});

export default MedicalDocumentNFTModule;