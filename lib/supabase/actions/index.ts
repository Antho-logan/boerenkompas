/**
 * Server Actions Index
 * Re-exports all server actions for convenient imports
 */

// Document actions
export {
    getDocuments,
    getDocument,
    createDocument,
    updateDocument,
    updateDocumentStatus,
    deleteDocument,
    getDocumentSignedUrl,
    getDocumentsStats,
} from './documents';

// Task actions
export {
    getTasks,
    getOpenTasks,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    getTaskCounts,
} from './tasks';

// Dossier actions
export {
    getDossierTemplates,
    getTemplateRequirements,
    getDocumentLinks,
    linkDocumentToRequirement,
    removeDocumentLink,
    getRequirementsWithStatus,
    getDossierCheckSummary,
    generateMissingItems,
} from './dossier';

// Export actions
export {
    getExports,
    createExport,
    getExport,
    getExportByToken,
    deleteExport,
    getExportDocumentUrls,
} from './exports';

// Member actions
export {
    getTenantMembers,
    addTenantMember,
    updateMemberRole,
    removeTenantMember,
} from './members';

// Audit actions
export {
    logAuditEvent,
    getAuditLog,
    getAuditLogWithUsers,
} from './audit';
