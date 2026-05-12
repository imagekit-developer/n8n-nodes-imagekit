[<img width="250" alt="ImageKit.io" src="https://raw.githubusercontent.com/imagekit-developer/imagekit-javascript/master/assets/imagekit-light-logo.svg"/>](https://imagekit.io)

# ImageKit.io n8n Community Node

[![npm version](https://img.shields.io/npm/v/@ahnv/n8n-nodes-imagekit)](https://www.npmjs.com/package/@ahnv/n8n-nodes-imagekit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![n8n Community Node](https://img.shields.io/badge/n8n-community%20node-FF6D5A)](https://docs.n8n.io/integrations/community-nodes/)
[![Twitter Follow](https://img.shields.io/twitter/follow/imagekitio?label=Follow&style=social)](https://twitter.com/ImagekitIo)

This n8n community node brings [ImageKit.io](https://imagekit.io/) media management APIs directly into your automation workflows. Use it to upload, organize, search, update, and manage files and folders in your ImageKit media library without writing custom integration code.

ImageKit is a complete media management platform for real-time image and video optimization, transformation, storage, metadata management, and delivery through a global CDN. With this node, n8n workflows can connect ImageKit with your CMS, DAM, e-commerce, support, analytics, and internal operations systems.

[n8n](https://n8n.io/) is a workflow automation platform that helps you connect apps, APIs, and services with low-code workflows.

## Installation

You can install the node in n8n using the community nodes UI.

1. Open your n8n instance.
2. Go to **Settings > Community Nodes**.
3. Select **Install**.
4. Enter the package name:

```bash
@ahnv/n8n-nodes-imagekit
```

5. Select **Install** and restart n8n if your deployment requires it.

For more details, refer to the n8n [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

## Documentation

Refer to the ImageKit [official API documentation](https://imagekit.io/docs/api-reference) for detailed API behavior, request parameters, and response formats.

For n8n-specific setup, see:

- **Community nodes:** [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- **Credentials:** [n8n credentials documentation](https://docs.n8n.io/credentials/)
- **Workflows:** [n8n workflow documentation](https://docs.n8n.io/workflows/)

## What you can build

Use this node to automate common ImageKit media workflows:

- **Upload assets:** Upload files from n8n binary data or remote URLs.
- **Organize media:** Create, move, copy, rename, and delete files and folders.
- **Search assets:** List and search media library assets with filters, pagination, and sorting.
- **Manage metadata:** Fetch metadata, update custom metadata, and manage custom metadata field definitions.
- **Process in bulk:** Delete files or update tags across multiple file IDs.
- **Maintain delivery freshness:** Purge CDN cache and check purge request status.
- **Automate account operations:** Manage origins, URL endpoints, usage data, and saved extensions.
- **React to ImageKit events:** Use webhook triggers to start workflows from ImageKit events.

## Supported resources

The node supports the following ImageKit resources and operations.

### Asset

- **List and Search:** List files, folders, and file versions with pagination, sorting, type filters, file type filters, and path filters.

### File

- **Upload:** Upload a file from binary data or a URL.
- **Get Details:** Fetch file details by file ID.
- **Update:** Update file details, tags, custom metadata, extensions, privacy, publication state, and related settings.
- **Delete:** Delete a file by file ID.
- **Copy:** Copy a file to another folder.
- **Move:** Move a file to another folder.
- **Rename:** Rename a file.
- **Bulk Delete:** Delete multiple files by file ID.
- **Bulk Add Tags:** Add tags to multiple files.
- **Bulk Remove Tags:** Remove tags from multiple files.
- **Bulk Remove AI Tags:** Remove AI tags from multiple files.

### File Version

- **List:** List all versions of a file.
- **Get:** Fetch details for a specific file version.
- **Delete:** Delete a specific file version.
- **Restore:** Restore a file to a specific version.

### Metadata

- **Get by File ID:** Fetch metadata for a file using its file ID.
- **Get from URL:** Fetch metadata for a file using its URL.

### Folder

- **Create:** Create a folder.
- **Delete:** Delete a folder.
- **Copy:** Copy a folder to another location.
- **Move:** Move a folder to another location.
- **Rename:** Rename a folder.
- **Get Job Status:** Check the status of an asynchronous folder operation.

### Custom Metadata Fields

- **Create:** Create a custom metadata field.
- **Update:** Update an existing custom metadata field.
- **List:** List custom metadata fields.
- **Delete:** Delete a custom metadata field.

### Purge Cache

- **Purge:** Purge CDN cache for a file URL.
- **Get Purge Status:** Check the status of a purge request.

### Account

- **Get Usage:** Fetch ImageKit account usage statistics.

### Account Origin

- **Create:** Create an origin.
- **Update:** Update an origin.
- **List:** List origins.
- **Get:** Fetch origin details.
- **Delete:** Delete an origin.

### Account URL Endpoint

- **Create:** Create a URL endpoint.
- **Update:** Update a URL endpoint.
- **List:** List URL endpoints.
- **Get:** Fetch URL endpoint details.
- **Delete:** Delete a URL endpoint.

### Saved Extension

- **Create:** Create a saved extension.
- **Update:** Update a saved extension.
- **List:** List saved extensions.
- **Get:** Fetch saved extension details.
- **Delete:** Delete a saved extension.

### Trigger

- **ImageKit Trigger:** Listen for ImageKit webhook events and start n8n workflows automatically.

## Authentication

To use this node, create ImageKit API credentials in n8n.

1. Sign in to your [ImageKit dashboard](https://imagekit.io/dashboard).
2. Go to **Developer Options > API Keys**.
3. Copy your **Private Key**.
4. In n8n, create credentials of type **ImageKit API**.
5. Paste the private key and save the credentials.

For webhook triggers, configure credentials of type **ImageKit Webhook API** with the webhook secret used to verify incoming ImageKit webhook payloads.

**Security note:** Your ImageKit private key can perform privileged account operations. Store it only in n8n credentials and never expose it in workflow data, logs, frontend code, or shared screenshots.

## Usage

### Upload a file

1. Add the **ImageKit** node to your workflow.
2. Select **File** as the resource.
3. Select **Upload** as the operation.
4. Provide either:
   - **Input Data Field Name** for binary data from a previous node, or
   - **File URL** for a remote file.
5. Set the file name and optional upload settings such as folder, tags, overwrite behavior, custom metadata, and response fields.
6. Execute the workflow.

### List and search assets

1. Add the **ImageKit** node to your workflow.
2. Select **Asset** as the resource.
3. Select **List and Search** as the operation.
4. Configure **Limit**, **Skip**, **Sort By**, and **Sort Direction**.
5. Optionally filter by path, file type, or asset type.

### Search query examples

ImageKit supports Lucene-like search syntax for advanced asset discovery.

```text
name:"image.jpg"
type:image
size:>1000000
tags:product AND tags:featured
```

Refer to ImageKit's [list and search assets documentation](https://imagekit.io/docs/api-reference/digital-asset-management-dam/list-and-search-assets) for the full search syntax.

## TypeScript and n8n support

This node is written in TypeScript and uses the n8n node API.

- **Minimum n8n version:** `0.198.0`
- **Node API version:** `1`
- **ImageKit API:** v1 endpoints

The package is built with the official `@n8n/node-cli` tooling and includes typed node descriptions, credentials, webhook triggers, and unit tests.

## Development

Clone the repository and install dependencies:

```bash
npm install
```

Run the main development commands:

```bash
npm run build
npm run lint
npm test
```

Generated ImageKit resource files are produced from the OpenAPI specification and local generator config:

```bash
npm run generate
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup, generation, testing, and release instructions.

## Changelog

For a detailed history of changes, refer to [CHANGELOG.md](CHANGELOG.md).

## Resources

- [ImageKit](https://imagekit.io/)
- [ImageKit API documentation](https://imagekit.io/docs/api-reference)
- [ImageKit dashboard](https://imagekit.io/dashboard)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [n8n workflow documentation](https://docs.n8n.io/workflows/)
