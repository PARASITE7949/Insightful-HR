import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import { Phone, ShieldCheck } from "lucide-react";

interface OTPVerificationProps {
  phone: string;
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export function OTPVerification({ phone, email, onVerified, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    sendOTP();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const sendOTP = async () => {
    setIsLoading(true);
    try {
      // Normalize phone to E.164 for common cases (India +91 for 10-digit numbers)
      let phoneToSend = phone || "";
      if (phoneToSend && !phoneToSend.startsWith("+")) {
        const digits = phoneToSend.replace(/\D/g, "");
        if (digits.length === 10) {
          phoneToSend = `+91${digits}`;
        } else {
          phoneToSend = `+${digits}`;
        }
      }

      const result = await apiClient.post("/auth/request-otp", { email, phone: phoneToSend });
      if (result.otp) {
        // Development mode - show OTP
        toast.info(`OTP: ${result.otp}`, { duration: 10000 });
      } else {
        toast.success(`OTP sent to ${phone}`);
      }
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await apiClient.post("/auth/verify-otp", { email, otp });
      if (result.success) {
        toast.success("Phone number verified!");
        onVerified();
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">Verify Your Phone</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enter the 6-digit code sent to <strong>{phone}</strong>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="otp">Enter OTP</Label>
        <Input
          id="otp"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="text-center text-2xl tracking-[0.5em] font-mono"
          disabled={isLoading}
        />
      </div>

      <Button onClick={handleVerify} className="w-full" disabled={otp.length !== 6 || isLoading}>
        <ShieldCheck className="h-4 w-4 mr-2" />
        {isLoading ? "Verifying..." : "Verify OTP"}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={isLoading}>
          ← Change number
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={sendOTP}
          disabled={!canResend || isLoading}
        >
          {canResend ? "Resend OTP" : `Resend in ${countdown}s`}
        </Button>
      </div>
    </div>
  );
}
