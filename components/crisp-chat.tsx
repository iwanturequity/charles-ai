"use client";
import { Crisp } from "crisp-sdk-web";
import { useEffect } from "react";

export const CrispChat= () => {
	useEffect(() => {
        const websiteId = process.env.CRISP_WEBSITE_ID;
        if (websiteId) {
        Crisp.configure(websiteId);
       } else {
      console.error('NEXT_PUBLIC_CRISP_WEBSITE_ID is not set');
      }
	}, []);

	return null;
};