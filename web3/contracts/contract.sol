// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MedicalDocumentNFT is ERC721URIStorage {
    address payable public hospitalAdmin;
    uint256 private currentDocumentId;
    uint256 private totalDocumentsIssued;
    
    struct MedicalDocument {
        uint256 documentId;
        address patient;
        address issuer;
        uint256 issuedDate;
        bool isActive;
    }
    
    mapping(uint256 => MedicalDocument) private documentIdToRecord;
    mapping(address => uint256[]) private patientToDocuments;
    
    modifier onlyAdmin {
        require(msg.sender == hospitalAdmin, "Only admin can call this function");
        _;
    }
    
    event DocumentMinted(uint256 indexed documentId, address indexed patient, address indexed issuer);
    event DocumentTransferred(uint256 indexed documentId, address indexed from, address indexed to);
    event DocumentRevoked(uint256 indexed documentId);
    
    constructor() ERC721("MedicalRecords", "MEDREC"){
        hospitalAdmin = payable(msg.sender);
    }
    
    function updateAdmin(address payable _newAdmin) public onlyAdmin{
        require(_newAdmin != address(0), "Invalid admin address");
        hospitalAdmin = _newAdmin;
    }
    
    function getCurrentDocumentId() public view returns(uint256) {
        return currentDocumentId;
    }
    
    function getTotalDocumentsIssued() public view returns(uint256) {
        return totalDocumentsIssued;
    }
    
    function getMedicalDocument(uint256 _documentId) public view returns(MedicalDocument memory){
        return documentIdToRecord[_documentId];
    }
    
    function createMedicalDocument(string memory documentURI, address _patient) public returns(uint256){
        require(_patient != address(0), "Invalid patient address");
        
        currentDocumentId++;
        uint256 newDocumentId = currentDocumentId;
        
        _safeMint(_patient, newDocumentId);
        _setTokenURI(newDocumentId, documentURI);
        
        createDocumentRecord(newDocumentId, _patient);
        totalDocumentsIssued++;
        
        emit DocumentMinted(newDocumentId, _patient, msg.sender);
        
        return newDocumentId;
    }
    
    function createDocumentRecord(uint256 _documentId, address _patient) private{
        documentIdToRecord[_documentId] = MedicalDocument({
            documentId: _documentId,
            patient: _patient,
            issuer: msg.sender,
            issuedDate: block.timestamp,
            isActive: true
        });
        
        patientToDocuments[_patient].push(_documentId);
    }
    
    function transferDocument(uint256 documentId, address to) public{
        require(ownerOf(documentId) == msg.sender, "You are not the owner of this document");
        require(to != address(0), "Invalid recipient address");
        
        MedicalDocument storage document = documentIdToRecord[documentId];
        address from = msg.sender;
        
        _transfer(from, to, documentId);
        document.patient = to;
        patientToDocuments[to].push(documentId);
        
        emit DocumentTransferred(documentId, from, to);
    }
    
    function revokeDocument(uint256 documentId) public onlyAdmin{
        require(documentIdToRecord[documentId].isActive, "Document already revoked");
        documentIdToRecord[documentId].isActive = false;
        
        emit DocumentRevoked(documentId);
    }
    
    function getAllMedicalDocuments() public view returns (MedicalDocument[] memory){
        uint256 totalDocumentCount = currentDocumentId;
        MedicalDocument[] memory allDocuments = new MedicalDocument[](totalDocumentCount);
        
        for(uint256 i = 0; i < totalDocumentCount; i++){
            uint256 documentId = i + 1;
            MedicalDocument storage document = documentIdToRecord[documentId];
            allDocuments[i] = document;
        }
        
        return allDocuments;
    }
    
    function getMyDocuments() public view returns(MedicalDocument[] memory) {
        uint256[] memory myDocumentIds = patientToDocuments[msg.sender];
        uint256 myDocumentCount = myDocumentIds.length;
        
        MedicalDocument[] memory myDocuments = new MedicalDocument[](myDocumentCount);
        
        for(uint256 i = 0; i < myDocumentCount; i++){
            uint256 documentId = myDocumentIds[i];
            myDocuments[i] = documentIdToRecord[documentId];
        }
        
        return myDocuments;
    }
    
    function getDocumentsByPatient(address _patient) public view returns(MedicalDocument[] memory) {
        uint256[] memory documentIds = patientToDocuments[_patient];
        uint256 documentCount = documentIds.length;
        
        MedicalDocument[] memory documents = new MedicalDocument[](documentCount);
        
        for(uint256 i = 0; i < documentCount; i++){
            uint256 documentId = documentIds[i];
            documents[i] = documentIdToRecord[documentId];
        }
        
        return documents;
    }
    
    function isDocumentActive(uint256 documentId) public view returns(bool) {
        return documentIdToRecord[documentId].isActive;
    }
}