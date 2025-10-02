'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useParams } from 'next/navigation';
import artifact from '@/app/marketplace.json';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const contractAddress = artifact.address;
const contractABI = artifact.abi;

interface Document {
  documentId: number;
  patient: string;
  issuer: string;
  issuedDate: number;
  isActive: boolean;
  tokenURI: string;
  metadata?: any;
}

const DocDetailPage = () => {
  const params = useParams();
  const { id } = params;
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocDetails = async () => {
      if (id && typeof window.ethereum !== 'undefined') {
        setLoading(true);
        setError(null);
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(contractAddress, contractABI, provider);

          const docData = await contract.getMedicalDocument(id);
          const tokenURI = await contract.tokenURI(id);

          let metadata = null;
          try {
            const response = await fetch(tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/'));
            if (response.ok) {
              metadata = await response.json();
            }
          } catch (e) {
            console.error('Failed to fetch metadata', e);
          }

          setDoc({
            documentId: Number(docData.documentId),
            patient: docData.patient,
            issuer: docData.issuer,
            issuedDate: Number(docData.issuedDate),
            isActive: docData.isActive,
            tokenURI,
            metadata,
          });
        } catch (err) {
          console.error(err);
          setError('Failed to fetch document details.');
        } finally {
          setLoading(false);
        }
      } else if (typeof window.ethereum === 'undefined') {
        setError('Please install MetaMask to view document details.');
        setLoading(false);
      }
    };

    if (id) {
      fetchDocDetails();
    }
  }, [id]);

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading document...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">{error}</div>;
  }

  if (!doc) {
    return <div className="container mx-auto p-4 text-center">Document not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{doc.metadata?.name || `Document #${doc.documentId}`}</CardTitle>
        </CardHeader>
        <CardContent>
          {doc.metadata?.image && (
            <img
              src={doc.metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')}
              alt={doc.metadata.name}
              className="w-full max-w-md mx-auto h-auto object-cover mb-6 rounded-md"
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="truncate">
              <span className="font-semibold">Patient Address:</span> {doc.patient}
            </div>
            <div>
              <span className="font-semibold">Issued Date:</span> {new Date(doc.issuedDate * 1000).toLocaleString()}
            </div>
            <div className="col-span-1 md:col-span-2 truncate">
              <span className="font-semibold">Token URI:</span>{' '}
              <a
                href={doc.tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {doc.tokenURI}
              </a>
            </div>
          </div>
          {doc.metadata?.description && (
            <p className="mt-4">
              <span className="font-semibold">Description:</span> {doc.metadata.description}
            </p>
          )}
          {doc.metadata?.attributes && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2 text-lg">Attributes:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {doc.metadata.attributes.map((attr: any, index: number) => (
                  <div key={index} className="border p-3 rounded-lg text-center bg-background">
                    <div className="text-xs text-muted-foreground">{attr.trait_type}</div>
                    <div className="font-semibold text-base">{attr.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocDetailPage;
