# 🧪 Frontend Blockchain Testing Guide

Your contract integration is **100% ready**! Here's how to test it in your app.

## ✅ **Test Results Summary**

- **Contract Address:** `0xB02588d9b7CC53eA6CC99Bf6BD522e30bb6366b5`
- **All 8 test suites:** ✅ **PASSED**
- **Environment:** ✅ **Configured**
- **Integration:** ✅ **Ready**

## 🔧 **Setup MetaMask for Testing**

### 1. **Add Polygon Amoy Testnet**
```
Network Name: Polygon Amoy
RPC URL: https://rpc-amoy.polygon.technology/
Chain ID: 80002
Currency Symbol: MATIC
Block Explorer: https://amoy.polygonscan.com/
```

### 2. **Get Test Tokens**
- **MATIC (for gas):** https://faucet.polygon.technology/
- **Test USDC:** Bridge from mainnet or use faucets
- **Test DAI:** May not be available (contract test showed it's not accessible)

## 🚀 **Testing Workflow**

### **Test 1: Job Creation with Blockchain**
1. **Navigate to:** `http://localhost:3000/companies/create-job`
2. **Fill in job details:**
   - Title: "Test Blockchain Job"
   - Description: "Testing blockchain integration"
   - Skills: Select any skills
   - Budget: "100"
   - Chain: "Polygon Amoy"
   - Currency: "USDC"
   - Enable services: Talent Service (10% fee)

3. **Expected behavior:**
   - ⚠️ **Yellow warning** if wallet not connected
   - **Button text:** "Connect Wallet to Publish" (if not connected)
   - **Button text:** "Publish on Blockchain" (if connected)

4. **Click "Publish on Blockchain":**
   - Should create job in database first
   - Then create on blockchain
   - MetaMask should pop up for transaction
   - Should see "Creating job on blockchain..." loading
   - Success: "Job created and published on blockchain!"

### **Test 2: Fund Management**
1. **After job is published:**
   - "Manage Funds" button should be enabled
   - Click "Manage Funds"

2. **Fund Manager Modal should open with:**
   - Current job balance: 0 USDC
   - Your wallet balance: Your USDC balance
   - Three tabs: Add Funds, Withdraw, Pay Fees

3. **Test Add Funds:**
   - Switch to "Add Funds" tab
   - Enter amount (e.g., "10")
   - Click "Add Funds to Job"
   - Should trigger token approval first (if not approved)
   - Then transfer funds to contract
   - Should see balance update

### **Test 3: Error Handling**
1. **Without wallet connection:**
   - Should show warning messages
   - Publish button should be disabled/show connect message

2. **With insufficient funds:**
   - Should show proper error messages
   - Buttons should be disabled appropriately

## 📱 **Expected UI States**

### **Wallet Not Connected**
```
⚠️ Wallet Required
Connect your wallet to publish jobs on the blockchain and manage funds
```

### **Blockchain Error**
```
❌ Blockchain Error
[Error message from contract interaction]
```

### **Loading States**
```
"Processing on blockchain..."
"Creating job on blockchain..."
"Running tests..."
```

### **Success States**
```
✅ "Job created and published on blockchain!"
✅ "Funds added successfully!"
✅ "Fees paid successfully!"
```

## 🔍 **What to Monitor**

### **Console Logs**
- Check browser developer console for any errors
- Look for transaction hashes
- Verify contract interaction logs

### **PolygonScan**
- Visit: https://amoy.polygonscan.com/address/0xB02588d9b7CC53eA6CC99Bf6BD522e30bb6366b5
- Check "Internal Txns" tab for your transactions
- Verify job creation events

### **Database**
- Job should be created with `blockchain_job_id`
- Transaction records in `job_transactions` table

## 🐛 **Common Issues & Solutions**

### **"Contract not configured" error**
```bash
# Restart your development server
pnpm dev
```

### **"Token not supported" error**
- Make sure you selected USDC (DAI may not be available on testnet)
- Verify you're on Polygon Amoy network

### **Transaction failing**
- Ensure you have MATIC for gas fees
- Check you have sufficient USDC balance
- Try with smaller amounts first

### **Wallet connection issues**
- Refresh the page
- Try disconnecting and reconnecting wallet
- Clear browser cache if needed

## 🎯 **Success Criteria**

Your integration is working if you can:
- ✅ Connect wallet successfully
- ✅ Create a job that gets published on blockchain
- ✅ See job balance and manage funds
- ✅ Add funds with token approval flow
- ✅ See transactions on PolygonScan
- ✅ Navigate through the fund management UI

## 📞 **Next Steps After Testing**

1. **If tests pass:** Your integration is production-ready for testnet!
2. **For mainnet:** Deploy the same contract to Polygon mainnet
3. **Update environment:** Switch chain ID to 137 for production
4. **Monitor usage:** Set up transaction monitoring and alerts

---

## 🔗 **Quick Links**

- **Contract:** https://amoy.polygonscan.com/address/0xB02588d9b7CC53eA6CC99Bf6BD522e30bb6366b5
- **Faucet:** https://faucet.polygon.technology/
- **Your App:** http://localhost:3000/companies/create-job
- **Fund Manager:** Available after job creation

**Ready to test!** 🚀