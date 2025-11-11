import Modal from "@components/modal";
import toast from "react-hot-toast";

// PopupModal component removed - will be replaced with Thirdweb integration
const PopupModal = () => null;

interface JobModalsProps {
  isManageFundsModalOpen: boolean;
  setIsManageFundsModalOpen: (open: boolean) => void;
  jobData: any;
  isPopupModalOpen: boolean;
  setIsPopupModalOpen: (open: boolean) => void;
  popupModalType: string;
  selectedCurrency: any;
}

export const JobModals = ({
  isManageFundsModalOpen,
  setIsManageFundsModalOpen,
  jobData,
  isPopupModalOpen,
  setIsPopupModalOpen,
  popupModalType,
  selectedCurrency,
}: JobModalsProps) => {
  // Handler functions with toast notifications for upcoming features
  const handleFundsAction = (action: string) => {
    setIsManageFundsModalOpen(false);
    switch (action) {
      case "addFunds":
        toast("Adding funds will be available after Web3 integration. Coming soon!", {
          icon: "💰",
          duration: 4000,
        });
        break;
      case "withdraw":
        toast("Withdrawing funds will be available after Web3 integration. Coming soon!", {
          icon: "💸",
          duration: 4000,
        });
        break;
      case "transfer":
        toast("Payment transfer will be available after Web3 integration. Coming soon!", {
          icon: "🔄",
          duration: 4000,
        });
        break;
      default:
        toast("This feature will be available after Web3 integration. Coming soon!", {
          icon: "💡",
          duration: 4000,
        });
    }
  };

  return (
    <>
      <Modal
        open={isManageFundsModalOpen}
        onClose={() => setIsManageFundsModalOpen(false)}
      >
        <div className="flex justify-between p-5 min-w-[300px]">
          <h3 className="text-2xl font-semibold text-black">Manage Funds:</h3>
          <button
            type="button"
            onClick={() => setIsManageFundsModalOpen(false)}
            className="w-6 h-6 text-black bg-gray-400 rounded-full"
          >
            &#10005;
          </button>
        </div>
        <p className="px-5 mt-2 mb-3 font-base">{`Funds will primarily be allocated to cover the Protocol's Fees.`}</p>
        <div className="flex flex-col p-5 justify-center items-center">
          {!!jobData?.job_id && (
            <button
              className="my-2 text-base font-semibold bg-transparent border-2 border-[#FFC905] h-14 w-56 rounded-full transition duration-150 ease-in-out"
              type="button"
              onClick={() => handleFundsAction("addFunds")}
            >
              Provision Funds
            </button>
          )}
          {!!jobData?.job_id && !!jobData?.escrowAmount && (
            <button
              className="my-2 text-base font-semibold bg-transparent border-2 border-[#FFC905] h-14 w-56 rounded-full transition duration-150 ease-in-out"
              type="button"
              onClick={() => handleFundsAction("withdraw")}
            >
              Withdraw Funds
            </button>
          )}

          {!!jobData?.job_id && !!jobData?.escrowAmount && (
            <button
              className="my-2 text-base font-semibold bg-transparent border-2 border-[#FFC905] h-14 w-56 rounded-full transition duration-150 ease-in-out"
              type="button"
              onClick={() => handleFundsAction("transfer")}
            >
              Pay Now
            </button>
          )}
        </div>
      </Modal>
      {/* PopupModal removed - replaced with toast notifications */}
    </>
  );
};
