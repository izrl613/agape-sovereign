#!/bin/bash

# Agape Sovereign Enclave 2026 - Deployment Automator
echo "--------------------------------------------------"
echo "💎 INITIATING SOVEREIGN DEPLOYMENT PROTOCOL 💎"
echo "--------------------------------------------------"

# Trigger the Cloud Build sequence
gcloud builds submit --config cloudbuild.yaml .

echo "--------------------------------------------------"
echo "✅ DEPLOYMENT SEQUENCE COMPLETE"
echo "ENCLAVE STATUS: HARDENED & ONLINE"
echo "--------------------------------------------------"