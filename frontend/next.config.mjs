/** @type {import('next').NextConfig} */
import withBundleAnalyzerFactory from "@next/bundle-analyzer";

const withBundleAnalyzer = withBundleAnalyzerFactory({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {};

export default withBundleAnalyzer(nextConfig);
