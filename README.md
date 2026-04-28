# n8n-nodes-imagekit

This is an n8n community node that lets you use [ImageKit](https://imagekit.io/) in your n8n workflows.

ImageKit is a complete media management solution that provides real-time image and video optimization, transformation, and delivery through a global CDN. This node allows you to integrate ImageKit's powerful media APIs directly into your n8n automation workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Development Status

### Core Features
- [x] Basic node structure and configuration
- [x] ImageKit API credentials setup
- [x] Asset listing and search functionality
- [x] File upload, get, update, delete, copy, move, rename operations
- [x] Bulk file operations (delete, add tags, remove tags, remove AI tags)
- [x] File version management (list, get, delete, restore)
- [x] Metadata extraction (by file ID, from URL)
- [x] Folder management (create, delete, copy, move, rename, job status)
- [x] Custom metadata fields management (create, update, list, delete)
- [x] Cache purging (purge, get status)
- [x] Account usage retrieval
- [x] Account origins management (create, update, list, get, delete)
- [x] Account URL endpoints management (create, update, list, get, delete)
- [x] Saved extensions management (create, update, list, get, delete)
- [ ] Webhook triggers (listen for ImageKit events)

### Testing & Quality
- [x] Unit tests implementation
- [ ] Integration tests with ImageKit API
- [ ] Error handling improvements
- [ ] Input validation enhancements
- [ ] Performance optimization

### Documentation & Release
- [x] README documentation
- [ ] API documentation
- [ ] Usage examples and tutorials
- [ ] Changelog maintenance
- [ ] NPM package publishing

## Table of Contents

- [Installation](#installation)
- [Operations](#operations)
- [Credentials](#credentials)
- [Compatibility](#compatibility)
- [Usage](#usage)
- [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### NPM Installation

```bash
npm install n8n-nodes-imagekit
```

### Manual Installation

1. Go to **Settings > Community Nodes** in your n8n instance
2. Enter `n8n-nodes-imagekit` in the npm package name field
3. Click **Install**

## Operations

This node supports the following ImageKit resources and operations:

### Asset
- **List and Search**: List all uploaded files and folders in your ImageKit media library with advanced search capabilities using Lucene-like syntax

### File
- **Upload**: Upload a file from binary data or URL
- **Get Details**: Get details of a file by its ID
- **Update**: Update file details (tags, custom metadata, extensions, etc.)
- **Delete**: Delete a file by its ID
- **Copy**: Copy a file to another location
- **Move**: Move a file to another location
- **Rename**: Rename a file
- **Bulk Delete**: Delete multiple files by their IDs
- **Bulk Add Tags**: Add tags to multiple files
- **Bulk Remove Tags**: Remove tags from multiple files
- **Bulk Remove AI Tags**: Remove AI tags from multiple files

### File Version
- **List**: List all versions of a file
- **Get**: Get a specific version of a file
- **Delete**: Delete a specific version of a file
- **Restore**: Restore a specific version of a file

### Metadata
- **Get by File ID**: Get metadata of a file by its ID
- **Get from URL**: Get metadata of a file from its remote URL

### Folder
- **Create**: Create a new folder
- **Delete**: Delete a folder
- **Copy**: Copy a folder to another location
- **Move**: Move a folder to another location
- **Rename**: Rename a folder
- **Get Job Status**: Get the status of a bulk folder operation job

### Custom Metadata Fields
- **Create**: Create a new custom metadata field
- **Update**: Update an existing custom metadata field
- **List**: List all custom metadata fields
- **Delete**: Delete a custom metadata field

### Purge Cache
- **Purge**: Purge cache for a file URL
- **Get Purge Status**: Get the status of a purge request

### Account
- **Get Usage**: Get account usage statistics

### Account Origin
- **Create**: Create a new origin
- **Update**: Update an existing origin
- **List**: List all origins
- **Get**: Get details of a specific origin
- **Delete**: Delete an origin

### Account URL Endpoint
- **Create**: Create a new URL endpoint
- **Update**: Update an existing URL endpoint
- **List**: List all URL endpoints
- **Get**: Get details of a specific URL endpoint
- **Delete**: Delete a URL endpoint

### Saved Extension
- **Create**: Create a new saved extension
- **Update**: Update an existing saved extension
- **List**: List all saved extensions
- **Get**: Get details of a specific saved extension
- **Delete**: Delete a saved extension

## Credentials

To use this node, you need to authenticate with ImageKit using your Private Key.

### Prerequisites

1. Sign up for an [ImageKit account](https://imagekit.io/)
2. Navigate to your ImageKit dashboard
3. Go to **Developer Options** > **API Keys**
4. Copy your **Private Key**

### Setting up Authentication

1. In n8n, create new credentials of type **ImageKit API**
2. Enter your ImageKit **Private Key** in the credentials form
3. Test the connection to ensure it's working correctly

**Security Note**: Never expose your private key in your workflows or share it publicly. The private key provides full access to your ImageKit account.

## Compatibility

- **Minimum n8n version**: 0.198.0
- **Tested with n8n versions**: 0.198.0+
- **Node API Version**: 1

This node uses the latest ImageKit API v1 endpoints and should be compatible with all current ImageKit features.

## Usage

### Basic File Listing

1. Add the ImageKit node to your workflow
2. Select **Asset** as the resource
3. Choose **List and Search** as the operation
4. Configure pagination settings (limit, skip)
5. Optionally add search queries using Lucene syntax

### Search Examples

The search functionality supports Lucene-like syntax for advanced filtering:

- `name:"image.jpg"` - Find files with exact name
- `type:image` - Find all image files
- `size:>1000000` - Find files larger than 1MB
- `tags:product AND tags:featured` - Find files with both tags

### Error Handling

The node includes built-in error handling for common scenarios:
- Invalid credentials
- Rate limiting
- Network timeouts
- Invalid search queries

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [ImageKit API Documentation](https://docs.imagekit.io/api-reference)
- [ImageKit Dashboard](https://imagekit.io/dashboard)
- [ImageKit Developer Guide](https://docs.imagekit.io/)
