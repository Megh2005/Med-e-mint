"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useContext, useState } from "react";
import { WalletContext } from "@/context/Wallet";
import WalletButton from "@/components/WalletButton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const MintPage = () => {
  const { isConnected, userAddress } = useContext(WalletContext);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    document: null as File | null,
  });

  const [errors, setErrors] = useState({
    title: "",
    description: "",
    document: "",
  });

  const validateForm = () => {
    const newErrors = {
      title: "",
      description: "",
      document: "",
    };

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.document) {
      newErrors.document = "Document is required";
    }

    setErrors(newErrors);
    return !newErrors.title && !newErrors.description && !newErrors.document;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      console.log(formData);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, document: file });
    if (file) {
      setErrors({ ...errors, document: "" });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-2xl p-8 space-y-8 bg-background rounded-lg shadow-neumorphic-lg">
        {isConnected && userAddress ? (
          <>
            <div className="text-center">
              <h1 className="text-3xl font-bold">Mint a New Document</h1>
              <p className="text-muted-foreground">
                Fill in the details below to mint your document as an NFT.
              </p>
              <div className="flex justify-center mt-4">
                <Badge className="shadow-neumorphic-inset bg-background hover:bg-background text-foreground p-2">
                  {userAddress}
                </Badge>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-foreground"
                >
                  Document Title
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (e.target.value.trim()) {
                      setErrors({ ...errors, title: "" });
                    }
                  }}
                  placeholder="e.g., My Medical Report"
                  className="mt-1 bg-background shadow-neumorphic-inset"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-foreground"
                >
                  Document Description
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  rows={5}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (e.target.value.trim()) {
                      setErrors({ ...errors, description: "" });
                    }
                  }}
                  placeholder="A brief description of the document..."
                  className="mt-1 resize-none bg-background shadow-neumorphic-inset"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="document"
                  className="block text-sm font-medium text-foreground"
                >
                  Upload Document
                </label>
                <Input
                  id="document"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleFileChange}
                  className="mt-1 bg-background shadow-neumorphic-inset"
                />
                {errors.document && (
                  <p className="mt-1 text-sm text-red-500">{errors.document}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full shadow-neumorphic active:shadow-neumorphic-inset"
              >
                Mint Document
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold">Connect Your Wallet</h1>
            <p className="text-muted-foreground mb-8">
              Please connect your wallet to mint a new document.
            </p>
            <WalletButton />
          </div>
        )}
      </div>
    </div>
  );
};

export default MintPage;