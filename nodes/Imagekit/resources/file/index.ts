import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { fileUploadDescription, uploadFile } from './upload';
import { fileGetDescription, getFile } from './get';
import { fileUpdateDescription, updateFile } from './update';
import { fileDeleteDescription, deleteFile } from './delete';
import { fileCopyDescription, copyFile } from './copy';
import { fileMoveDescription, moveFile } from './move';
import { fileRenameDescription, renameFile } from './rename';
import {
	fileBulkDescription,
	bulkDeleteFiles,
	bulkAddTags,
	bulkRemoveTags,
	bulkRemoveAITags,
} from './bulk';

const showOnlyForFile = {
	resource: ['file'],
};

export const fileDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForFile,
		},
		options: [
			{
				name: 'Upload',
				value: 'upload',
				action: 'Upload a file',
				description: 'Upload a file to ImageKit.',
			},
			{
				name: 'Get Details',
				value: 'get',
				action: 'Get file details',
				description: 'Get details of a file by its ID.',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update file details',
				description: 'Update details of a file.',
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a file',
				description: 'Delete a file by its ID.',
			},
			{
				name: 'Copy',
				value: 'copy',
				action: 'Copy a file',
				description: 'Copy a file to another location.',
			},
			{
				name: 'Move',
				value: 'move',
				action: 'Move a file',
				description: 'Move a file to another location.',
			},
			{
				name: 'Rename',
				value: 'rename',
				action: 'Rename a file',
				description: 'Rename a file.',
			},
			{
				name: 'Bulk Delete',
				value: 'bulkDelete',
				action: 'Bulk delete files',
				description: 'Delete multiple files by their IDs.',
			},
			{
				name: 'Bulk Add Tags',
				value: 'bulkAddTags',
				action: 'Bulk add tags to files',
				description: 'Add tags to multiple files.',
			},
			{
				name: 'Bulk Remove Tags',
				value: 'bulkRemoveTags',
				action: 'Bulk remove tags from files',
				description: 'Remove tags from multiple files.',
			},
			{
				name: 'Bulk Remove AI Tags',
				value: 'bulkRemoveAITags',
				action: 'Bulk remove AI tags from files',
				description: 'Remove AI tags from multiple files.',
			},
		],
		default: 'upload',
	},
	...fileUploadDescription,
	...fileGetDescription,
	...fileUpdateDescription,
	...fileDeleteDescription,
	...fileCopyDescription,
	...fileMoveDescription,
	...fileRenameDescription,
	...fileBulkDescription,
];

export async function executeFile(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', i) as string;

	switch (operation) {
		case 'upload':
			return uploadFile.call(this, i);
		case 'get':
			return getFile.call(this, i);
		case 'update':
			return updateFile.call(this, i);
		case 'delete':
			return deleteFile.call(this, i);
		case 'copy':
			return copyFile.call(this, i);
		case 'move':
			return moveFile.call(this, i);
		case 'rename':
			return renameFile.call(this, i);
		case 'bulkDelete':
			return bulkDeleteFiles.call(this, i);
		case 'bulkAddTags':
			return bulkAddTags.call(this, i);
		case 'bulkRemoveTags':
			return bulkRemoveTags.call(this, i);
		case 'bulkRemoveAITags':
			return bulkRemoveAITags.call(this, i);
		default:
			throw new Error(`Unsupported file operation: ${operation}`);
	}
}
