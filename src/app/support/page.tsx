'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Mail, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface SiteSettings {
    supportEmail: string | null;
    discordLink: string | null;
    twitterLink: string | null;
    instagramLink: string | null;
}

export default function SupportPage() {
    const router = useRouter();
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [isStartingChat, setIsStartingChat] = useState(false);
    const [feePercent, setFeePercent] = useState(5);
    const [siteSettings, setSiteSettings] = useState<SiteSettings>({
        supportEmail: null,
        discordLink: null,
        twitterLink: null,
        instagramLink: null,
    });

    // Fetch platform fee and site settings on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [feeRes, settingsRes] = await Promise.all([
                    fetch("/api/platform-fee"),
                    fetch("/api/site-settings"),
                ]);

                if (feeRes.ok) {
                    const data = await feeRes.json();
                    setFeePercent(data.transactionFeePercent);
                }

                if (settingsRes.ok) {
                    const data = await settingsRes.json();
                    setSiteSettings({
                        supportEmail: data.supportEmail || null,
                        discordLink: data.discordLink || null,
                        twitterLink: data.twitterLink || null,
                        instagramLink: data.instagramLink || null,
                    });
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    // FAQs with dynamic fee
    const faqs = [
        {
            question: "How does the Escrow system work?",
            answer: "When you purchase an item, your money is held safely in our Escrow system. The seller is notified to deliver the item. Once you confirm receipt, the funds are released to the seller. This ensures a safe transaction for both parties."
        },
        {
            question: "Is my personal information safe?",
            answer: "Yes, we use industry-standard encryption to protect your data. Your payment details are never stored on our servers, and we only share necessary information with sellers for transaction purposes."
        },
        {
            question: "What are the platform fees?",
            answer: `NexusTrade currently charges a ${feePercent}% fee per transaction to cover platform maintenance and support. This fee is deducted from seller earnings. Note: Platform fees may be adjusted by administrators and are subject to change.`
        },
        {
            question: "How do I verify my account?",
            answer: "To verify your account, go to your Profile settings and upload a valid government-issued ID. Verification helps build trust within the community and unlocks higher transaction limits."
        }
    ];

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const handleChatWithAdmin = async () => {
        setIsStartingChat(true);
        try {
            const res = await fetch("/api/support/chat", {
                method: "POST",
            });

            if (res.ok) {
                const data = await res.json();
                if (data.conversationId) {
                    router.push(`/messages/${data.conversationId}`);
                }
            } else {
                if (res.status === 401) {
                    router.push("/login?callbackUrl=/support");
                    return;
                }
                const error = await res.json();
                alert(error.error || "Failed to start chat.");
            }
        } catch (error) {
            console.error("Error starting chat:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsStartingChat(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

            {/* Header Section */}
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    <span className="gradient-text">How can we help?</span>
                </h1>
                <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                    Find answers to common questions or reach out to our team directly.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 flex-grow">

                {/* Left Column: FAQ */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center gap-2 mb-6">
                        <HelpCircle className="w-6 h-6 text-violet-500" />
                        <h2 className="text-2xl font-semibold text-zinc-100">Frequently Asked Questions</h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className={`glass rounded-xl overflow-hidden transition-all duration-300 ${openIndex === index ? 'glow-purple border-violet-500/30' : 'border-zinc-800'}`}
                            >
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                                >
                                    <span className="font-medium text-zinc-200 text-lg">{faq.question}</span>
                                    {openIndex === index ? (
                                        <ChevronUp className="w-5 h-5 text-violet-500 flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                                    )}
                                </button>
                                <div
                                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 pb-6 opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                >
                                    <p className="text-zinc-400 leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Contact Actions */}
                <div className="lg:col-span-5 space-y-8">

                    {/* Chat with Admin Card */}
                    <div className="glass p-8 rounded-2xl border border-zinc-800 hover:border-violet-500/30 transition-all duration-300 glow-purple relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center mb-6">
                                <MessageCircle className="w-6 h-6 text-violet-400" />
                            </div>

                            <h3 className="text-2xl font-bold text-zinc-100 mb-2">Live Support</h3>
                            <p className="text-zinc-400 mb-8">
                                Need immediate assistance? Chat directly with our admin team for real-time support.
                            </p>

                            <button
                                onClick={handleChatWithAdmin}
                                disabled={isStartingChat}
                                className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isStartingChat ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <MessageCircle className="w-5 h-5" />
                                )}
                                <span>{isStartingChat ? "Starting Chat..." : "Chat with Admin"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Email Support Card */}
                    <div className="glass p-8 rounded-2xl border border-zinc-800 hover:border-cyan-500/30 transition-all duration-300 group">
                        <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6">
                            <Mail className="w-6 h-6 text-cyan-400" />
                        </div>

                        <h3 className="text-xl font-bold text-zinc-100 mb-2">Email Us</h3>
                        <p className="text-zinc-400 mb-6">
                            For complex inquiries or non-urgent matters, drop us an email.
                        </p>

                        {siteSettings.supportEmail ? (
                            <a
                                href={`mailto:${siteSettings.supportEmail}`}
                                className="flex items-center gap-3 text-cyan-400 hover:text-cyan-300 transition-colors font-medium text-lg p-3 rounded-lg hover:bg-zinc-800/50"
                            >
                                <Mail className="w-5 h-5" />
                                {siteSettings.supportEmail}
                            </a>
                        ) : (
                            <p className="text-zinc-500 italic">No support email configured</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Section */}
            <footer className="mt-20 pt-8 border-t border-zinc-800/50 text-center md:text-left">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-xl font-bold gradient-text mb-4">NexusTrade</h3>
                        <p className="text-zinc-500 max-w-md">
                            The safest P2P marketplace for gamers. Buy, sell, and trade with confidence using our secure escrow system.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-zinc-100 font-semibold mb-4">Support</h4>
                        <ul className="space-y-2 text-zinc-400">
                            <li><Link href="/support" className="hover:text-violet-400 transition-colors">Help Center</Link></li>
                            <li><Link href="/terms" className="hover:text-violet-400 transition-colors">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="hover:text-violet-400 transition-colors">Privacy Policy</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-zinc-100 font-semibold mb-4">Community</h4>
                        <ul className="space-y-2 text-zinc-400">
                            {siteSettings.discordLink ? (
                                <li><a href={siteSettings.discordLink} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Discord</a></li>
                            ) : (
                                <li><span className="text-zinc-600">Discord</span></li>
                            )}
                            {siteSettings.twitterLink ? (
                                <li><a href={siteSettings.twitterLink} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Twitter</a></li>
                            ) : (
                                <li><span className="text-zinc-600">Twitter</span></li>
                            )}
                            {siteSettings.instagramLink ? (
                                <li><a href={siteSettings.instagramLink} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Instagram</a></li>
                            ) : (
                                <li><span className="text-zinc-600">Instagram</span></li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-zinc-900 text-center text-zinc-600 text-sm">
                    &copy; {new Date().getFullYear()} NexusTrade. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

