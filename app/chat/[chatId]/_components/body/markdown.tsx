"use client";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
import Image from "next/image";
import copy from "copy-to-clipboard";
import SyntaxHighlighter from "react-syntax-highlighter";
import { gruvboxDark } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import { Clipboard, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface IProps {
    content: string;
}

export default function Markdown({ content }: IProps) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
            components={{
                // 代码块
                code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const language = match ? match[1] : "";
                    const codeString = String(children).replace(/\n$/, "");

                    return match ? (
                        <div className="relative group rounded-md overflow-hidden my-4 border border-white/10">
                            {/* 代码块头部 */}
                            <div className="flex w-full justify-between items-center bg-white/5 px-4 py-2">
                                <span className="text-xs text-white/40 font-mono">
                                    {language}
                                </span>
                                <CopyButton text={codeString} />
                            </div>
                            <SyntaxHighlighter
                                language={language}
                                style={gruvboxDark}
                                customStyle={{
                                    margin: 0,
                                    padding: "1rem",
                                    background: "rgba(0, 0, 0, 0.3)",
                                }}
                            >
                                {codeString}
                            </SyntaxHighlighter>
                        </div>
                    ) : (
                        <code
                            className="px-1.5 py-0.5 bg-white/10 rounded text-sm font-mono text-rose-300"
                            {...props}
                        >
                            {children}
                        </code>
                    );
                },

                // 链接
                a({ href, children, ...props }) {
                    const isExternal =
                        href?.startsWith("http://") ||
                        href?.startsWith("https://");
                    return (
                        <a
                            href={href}
                            target={isExternal ? "_blank" : undefined}
                            rel={isExternal ? "noopener noreferrer" : undefined}
                            className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                            {...props}
                        >
                            {children}
                        </a>
                    );
                },

                // 图片
                img({ src, alt, ...props }) {
                    const width =
                        typeof props.width === "number"
                            ? props.width
                            : Number(props.width) || 1200;
                    const height =
                        typeof props.height === "number"
                            ? props.height
                            : Number(props.height) || 675;

                    if (!src || typeof src !== "string") return null;

                    return (
                        <Image
                            src={src}
                            alt={alt || ""}
                            width={width}
                            height={height}
                            unoptimized
                            sizes="100vw"
                            className="max-w-full h-auto rounded-lg my-4"
                        />
                    );
                },

                // 表格容器
                table({ children, ...props }) {
                    return (
                        <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
                            <table
                                className="min-w-full divide-y divide-white/10"
                                {...props}
                            >
                                {children}
                            </table>
                        </div>
                    );
                },

                // 表头
                th({ children, ...props }) {
                    return (
                        <th
                            className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider bg-white/5"
                            {...props}
                        >
                            {children}
                        </th>
                    );
                },

                // 表格单元格
                td({ children, ...props }) {
                    return (
                        <td
                            className="px-4 py-3 text-sm text-white/80"
                            {...props}
                        >
                            {children}
                        </td>
                    );
                },

                // 表格行
                tr({ children, ...props }) {
                    return (
                        <tr
                            className="hover:bg-white/5 transition-colors"
                            {...props}
                        >
                            {children}
                        </tr>
                    );
                },

                // 引用块
                blockquote({ children, ...props }) {
                    return (
                        <blockquote
                            className="border-l-4 border-blue-500/50 pl-4 py-1 my-2 text-white/70 italic"
                            {...props}
                        >
                            {children}
                        </blockquote>
                    );
                },

                // 水平线
                hr({ ...props }) {
                    return <hr className="border-white/10 my-6" {...props} />;
                },

                // 列表项
                li({ children, ...props }) {
                    return (
                        <li
                            className="text-white/90 marker:text-white/40"
                            {...props}
                        >
                            {children}
                        </li>
                    );
                },

                // 段落
                p({ children, ...props }) {
                    return (
                        <p className="my-2 leading-relaxed" {...props}>
                            {children}
                        </p>
                    );
                },

                // 标题
                h1({ children, ...props }) {
                    return (
                        <h1
                            className="text-2xl font-bold mt-6 mb-4 text-white"
                            {...props}
                        >
                            {children}
                        </h1>
                    );
                },
                h2({ children, ...props }) {
                    return (
                        <h2
                            className="text-xl font-bold mt-5 mb-3 text-white"
                            {...props}
                        >
                            {children}
                        </h2>
                    );
                },
                h3({ children, ...props }) {
                    return (
                        <h3
                            className="text-lg font-semibold mt-4 mb-2 text-white"
                            {...props}
                        >
                            {children}
                        </h3>
                    );
                },
                h4({ children, ...props }) {
                    return (
                        <h4
                            className="text-base font-semibold mt-3 mb-2 text-white"
                            {...props}
                        >
                            {children}
                        </h4>
                    );
                },

                // 强调
                strong({ children, ...props }) {
                    return (
                        <strong className="font-semibold text-white" {...props}>
                            {children}
                        </strong>
                    );
                },

                // 删除线
                del({ children, ...props }) {
                    return (
                        <del className="text-white/50 line-through" {...props}>
                            {children}
                        </del>
                    );
                },
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

// 复制按钮组件
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        copy(text);
        setCopied(true);
        toast.success("已复制到剪贴板");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="复制代码"
        >
            {copied ? (
                <Check className="text-green-400 w-4 h-4" />
            ) : (
                <Clipboard className="text-white/40 w-4 h-4" />
            )}
        </button>
    );
}
