// Splicer for the `file` resource: composes the 9 codegen'd ops in
// `_generated/file` with the 2 hand-written ones (`upload`, `update`)
// that involve binary-data handling and a complex `collection` UI which
// the generator doesn't yet support. See `openapi/config.json` for the
// full op list and `openapi/README.md` for the codegen rules.
import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import {
	fileDescription as generatedFileDescription,
	executeFile as executeGeneratedFile,
} from '../_generated/file';
import { fileUploadDescription, uploadFile } from './upload';
import { fileUpdateDescription, updateFile } from './update';

const showOnlyForFile = {
	resource: ['file'],
};

// Drop the generated operation switcher (always at index 0) so we can
// supply our own that also lists `upload` and `update`. The remaining
// generated entries are per-op fields, each already gated by its own
// `displayOptions.show.operation`, so they slot in unchanged.
const generatedFieldsOnly = generatedFileDescription.slice(1);

export const fileDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForFile },
		options: [
			{
				name: 'Bulk Add Tags',
				value: 'bulkAddTags',
				action: 'Bulk add tags to files',
				description: 'Add tags to multiple files',
			},
			{
				name: 'Bulk Delete',
				value: 'bulkDelete',
				action: 'Bulk delete files',
				description: 'Delete multiple files by their IDs',
			},
			{
				name: 'Bulk Remove AI Tags',
				value: 'bulkRemoveAITags',
				action: 'Bulk remove AI tags from files',
				description: 'Remove AI tags from multiple files',
			},
			{
				name: 'Bulk Remove Tags',
				value: 'bulkRemoveTags',
				action: 'Bulk remove tags from files',
				description: 'Remove tags from multiple files',
			},
			{
				name: 'Copy',
				value: 'copy',
				action: 'Copy a file',
				description: 'Copy a file to another location',
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a file',
				description: 'Delete a file by its ID',
			},
			{
				name: 'Get Details',
				value: 'get',
				action: 'Get file details',
				description: 'Get details of a file by its ID',
			},
			{
				name: 'Move',
				value: 'move',
				action: 'Move a file',
				description: 'Move a file to another location',
			},
			{
				name: 'Rename',
				value: 'rename',
				action: 'Rename a file',
				description: 'Rename a file',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update file details',
				description: 'Update details of a file',
			},
			{
				name: 'Upload',
				value: 'upload',
				action: 'Upload a file',
				description: 'Upload a file to ImageKit',
			},
		],
		default: 'upload',
	},
	...generatedFieldsOnly,
	...fileUploadDescription,
	...fileUpdateDescription,
];

export async function executeFile(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', i) as string;
	if (operation === 'upload') return uploadFile.call(this, i);
	if (operation === 'update') return updateFile.call(this, i);
	return executeGeneratedFile.call(this, i);
}
