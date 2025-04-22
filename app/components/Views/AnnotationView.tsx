//app/components/Views/AnnotationView.tsx

import { Annotation, AnnotationStatus, AnnotationHistory } from '@/app/types/types';
import { useState, useEffect } from 'react'; // Added useEffect
import { useSession} from "next-auth/react"
import { annotationTypeOptions, indicatorOptions, recommendationOptions, getOptionLabel, OptionType } from '@/app/components/Annotations/annotationOptions';

interface AnnotationViewProps {
    onUpdateAnnotation?: (id: string, actionType: 'update' | 'delete', update: any) => Promise<boolean>;
    selectedAnnotation: Annotation | null;
}

export default function AnnotationView({
    onUpdateAnnotation,
    selectedAnnotation,
}: AnnotationViewProps) {

    const { data: session } = useSession()
    const userRole = session?.user?.role;
    const userId = session?.user?.id;


    const [deleteModal, setDeleteModal] = useState({ isOpen: false, annotationId: null as string | null });
    const [editModal, setEditModal] = useState<{ isOpen: boolean; annotation: Annotation | null }>({ isOpen: false, annotation: null }); // Explicit type
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset modals if selectedAnnotation changes (e.g., user selects a different one)
    useEffect(() => {
        setDeleteModal({ isOpen: false, annotationId: null });
        setEditModal({ isOpen: false, annotation: null });
        setIsSubmitting(false); // Reset submitting state as well
    }, [selectedAnnotation?.id]); // Depend on the ID

    // --- Helper functions (getStatusColor, formatDate) remain the same ---
    function getStatusColor(status: AnnotationStatus | string): string {
      switch (status as AnnotationStatus) {
        case 'approved': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        case 'created': return 'bg-yellow-100 text-yellow-800';
        case 'deleted': return 'bg-gray-100 text-gray-500';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    function formatDate(dateString: string): string {
      if (!dateString) return 'N/A';
      try {
          const date = new Date(dateString);
          return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
      } catch (e) {
          return 'Invalid Date';
      }
    }
    // --- Async Handlers (handleDeleteConfirm, handleEditSave, handleStatusChange) remain the same ---
    const handleDeleteConfirm = async () => {
        if (deleteModal.annotationId && onUpdateAnnotation && !isSubmitting) {

            // only deleted flag is changed
            const changes = {
                field: 'deleted',
                oldValue: selectedAnnotation?.deleted ?? null,
                newValue: true
            };
            const historyEntry = generateHistoryEntry(
                'delete',
                { email: session?.user?.email ?? '', userId: session?.user?.id ?? '' },
                [changes]
            );
            const updatedAnnotation = {
                ...selectedAnnotation,
                deleted: true,
                history: [...((selectedAnnotation?.history || []) as AnnotationHistory[]), historyEntry] // Append new history entry
            };

            setIsSubmitting(true);
            const success = await onUpdateAnnotation(deleteModal.annotationId, 'delete', updatedAnnotation);
            setIsSubmitting(false);
            if (success) {
                setDeleteModal({ isOpen: false, annotationId: null });
            } else {
                console.error("Delete failed in modal callback");
                // Optional: Show error feedback to user
            }
        }
    };

    const handleEditSave = async (editedAnnotation: Annotation | null) => { // Allow null check
        if (editedAnnotation?.id && onUpdateAnnotation && !isSubmitting) {

             // Step 1: Identify fields that were changed
            const changes = Object.keys(editedAnnotation).map(field => {
                if (selectedAnnotation && selectedAnnotation[field as keyof Annotation] !== editedAnnotation[field as keyof Annotation]) {
                    return {
                        field, 
                        oldValue: selectedAnnotation[field as keyof Annotation], 
                        newValue: editedAnnotation[field as keyof Annotation]
                    };
                }
                return null;
            }).filter(change => change !== null) as Array<{ field: string; oldValue: any; newValue: any }>;

            // Step 2: Append the new history entry
            const historyEntry = generateHistoryEntry(
                'edit',
                { email: session?.user?.email ?? '', userId: session?.user?.id ?? '' },
                changes
            );
            

            // Step 3: Add history entry to the payload

            const updatedAnnotation = {
                ...editedAnnotation,
                history: [...(editedAnnotation.history || []), historyEntry] // Append new history entry
            };

            
            setIsSubmitting(true);
            const success = await onUpdateAnnotation(editedAnnotation.id, 'update', updatedAnnotation);
            setIsSubmitting(false);
            if (success) {
                setEditModal({ isOpen: false, annotation: null });
            } else {
                console.error("Edit save failed in modal callback");
                 // Optional: Show error feedback to user
            }
        }
    };

     const handleStatusChange = async (newStatus: AnnotationStatus) => {
        if (selectedAnnotation?.id && onUpdateAnnotation && !isSubmitting) {

            // it is only a status change field 
            const changes = {
                field: 'status',
                oldValue: selectedAnnotation.status,
                newValue: newStatus
            };
            const historyEntry = generateHistoryEntry(
                'edit',
                { email: session?.user?.email ?? '', userId: session?.user?.id ?? '' },
                [changes]
            );
            const updatedAnnotation = {
                ...selectedAnnotation,
                status: newStatus,
                history: [...(selectedAnnotation.history || []), historyEntry] // Append new history entry
            };
            
            const updatePayload = { status: newStatus }; // Only send the status change
            setIsSubmitting(true);
            await onUpdateAnnotation(selectedAnnotation.id, 'update', updatedAnnotation);
            setIsSubmitting(false);
            // Parent handles UI update via prop change
        }
    };

    // --- Modals ---
    const DeleteConfirmationModal = () => {
        if (!deleteModal.isOpen) return null;
        const baseButtonClass = "px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2";
        const disabledClass = "opacity-50 cursor-not-allowed";

        return (
            <div className="fixed inset-0 backdrop-blur-xs z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div
                    className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all"
                    onClick={(e) => e.stopPropagation()} // Prevent closing modal on inner click
                >
                    {/* ... modal header and text ... */}
                    <div className="flex items-center mb-4">
                        <div className="bg-red-100 rounded-full p-2 mr-3 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Delete Annotation</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-5">
                        Are you sure you want to delete this annotation? This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => !isSubmitting && setDeleteModal({ isOpen: false, annotationId: null })}
                            disabled={isSubmitting}
                            className={`${baseButtonClass} bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-300 ${isSubmitting ? disabledClass : ''}`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteConfirm}
                            disabled={isSubmitting}
                            className={`${baseButtonClass} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 ${isSubmitting ? disabledClass : ''}`}
                        >
                            {isSubmitting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };



    const EditAnnotationModal = () => {
        if (!editModal.isOpen || !editModal.annotation) return null;
    
        // Local state for the form within the modal
        const [editedAnnotation, setEditedAnnotation] = useState<Annotation>(() => ({
            ...editModal.annotation! // Initialize with the annotation passed to the modal
        }));
    
        // Update local state if the underlying annotation prop changes while modal is open
        useEffect(() => {
            if (editModal.annotation) {
                setEditedAnnotation({ ...editModal.annotation });
            }
        }, [editModal.annotation]);
    
        const baseButtonClass = "px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2";
        const disabledClass = "opacity-50 cursor-not-allowed";
    
        return (
            <div className="fixed inset-0 backdrop-blur-xs z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div
                    className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 transform transition-all overflow-y-auto max-h-[90vh]" // Allow scrolling if needed
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div className="flex items-center mb-4">
                        <div className="bg-blue-100 rounded-full p-2 mr-3 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a 2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Edit Annotation</h3>
                    </div>
    
                    {/* Form Fields */}
                    <div className="space-y-4">
                        {/* Annotation Type */}
                        <div className="mb-4">
                            <label htmlFor="edit-annotation-type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                id="edit-annotation-type"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                                value={editedAnnotation.annotationType || ""}
                                onChange={(e) => setEditedAnnotation((prev) => ({ ...prev!, annotationType: e.target.value }))}
                            >
                                <option value="" disabled>Choose Type</option>
                                {annotationTypeOptions.map((option: OptionType) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
    
                        {/* Description Field */}
                        <div className="mb-4">
                            <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                id="edit-description"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                value={editedAnnotation.description || ""}
                                rows={3}
                                onChange={(e) => setEditedAnnotation((prev) => ({ ...prev!, description: e.target.value }))}
                            />
                        </div>
    
                        {/* Status Dropdown */}
                        <div className="mb-4">
                            <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                id="edit-status"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                                value={editedAnnotation.status}
                                onChange={(e) => setEditedAnnotation((prev) => ({ ...prev!, status: e.target.value as AnnotationStatus }))}
                            >
                                <option value="created">Created</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
    
                        {/* Indicator Dropdown */}
                        <div className="mb-4">
                            <label htmlFor="edit-indicator" className="block text-sm font-medium text-gray-700 mb-1">Indicator</label>
                            <select
                                id="edit-indicator"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                                value={editedAnnotation.indicator || ""}
                                onChange={(e) => setEditedAnnotation((prev) => ({ ...prev!, indicator: e.target.value }))}
                            >
                                <option value="" disabled>Select an Indicator</option>
                                {indicatorOptions.map((option: OptionType) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
    
                        {/* Recommendation Dropdown */}
                        <div className="mb-4">
                            <label htmlFor="edit-recommendation" className="block text-sm font-medium text-gray-700 mb-1">Recommendation</label>
                            <select
                                id="edit-recommendation"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                                value={editedAnnotation.recommendation || ""}
                                onChange={(e) => setEditedAnnotation((prev) => ({ ...prev!, recommendation: e.target.value }))}
                            >
                                <option value="" disabled>Choose Recommendation</option>
                                {recommendationOptions.map((option: OptionType) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
    
                    {/* Actions */}
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                        <button
                            onClick={() => !isSubmitting && setEditModal({ isOpen: false, annotation: null })}
                            disabled={isSubmitting}
                            className={`${baseButtonClass} bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-300 ${isSubmitting ? disabledClass : ""}`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleEditSave(editedAnnotation)}
                            disabled={isSubmitting}
                            className={`${baseButtonClass} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 ${isSubmitting ? disabledClass : ""}`}
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- Main View Render ---
    if (!selectedAnnotation) {
        // Render nothing or a placeholder when no annotation is selected
        return <div className="p-4 text-center text-gray-400 text-sm">No annotation selected.</div>;
    }

    // Button styling (example)
    const actionButtonBase = `inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2`;
    const disabledButtonClass = `opacity-50 cursor-not-allowed`;

    // Function to generate history entry
    const generateHistoryEntry = (
        actionType: 'edit' | 'delete' | 'approve', 
        changedBy: { email: string; userId: string }, 
        changes: { field: string; oldValue: any; newValue: any }[]
      ): AnnotationHistory => {
        return {
          changedAt: new Date().toISOString(), // Set the current timestamp for the change
          changedBy,
          changes: changes.map(change => ({
            field: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue,
          }))
        };
      };

      return (
        <div className="p-2 border-t border-gray-200 bg-gray-50 h-[120px]">
            <div className="flex h-full items-center justify-between gap-x-4"> {/* Flex container ensures vertical alignment */}
                
                {/* Left Column: Annotation Details */}
                <div className="flex flex-col text-gray-700 justify-center h-full"> {/* Centered content */}
                    {/* First Row: Status and Type */}
                    <div className="flex flex-wrap text-s items-center gap-x-4 gap-y-1">
                        {/* Status */}
                        <div>
                            <span className="font-medium text-gray-900"><b>Status:</b></span>
                            <span className={`ml-1.5 px-2 py-0.5 rounded-full ${getStatusColor(selectedAnnotation.status)}`}>
                                {selectedAnnotation.status}
                            </span>
                        </div>
                        {/* Type */}
                        {selectedAnnotation.annotationType && (
                            <div>
                                <span className="font-medium text-gray-900"><b>Type:</b></span> {selectedAnnotation.annotationType}
                            </div>
                        )}
                    </div>
    
                    {/* Second Row: Indicator */}
                    {selectedAnnotation.indicator && (
                        <div className="mt-2 break-words text-sm whitespace-normal text-gray-900"> {/* Natural wrapping */}
                            <span className="font-medium"><b>Indicator:</b></span>
                            <span className="ml-1">{selectedAnnotation.indicator}</span>
                        </div>
                    )}
    
                    {/* Third Row: Range and By */}
                    <div className="mt-2 flex flex-wrap text-sm items-center gap-x-4 gap-y-1">
                        {/* Range */}
                        <div>
                            <span className="font-medium text-gray-900"><b>Range:</b></span>
                            {formatDate(selectedAnnotation.startDate)} - {formatDate(selectedAnnotation.endDate)}
                        </div>
                        {/* Created By */}
                        {selectedAnnotation.createdBy && (
                            <div>
                                <span className="font-medium text-gray-900"><b>By:</b></span> 
                                {selectedAnnotation.createdBy.email}
                            </div>
                        )}
                    </div>
                </div>
    
                {/* Right Column: Action Buttons */}
                <div className="flex-shrink-0 flex items-center space-x-2"> {/* Vertically centered buttons */}
                    {userRole === 'admin' || userRole === 'approver' ? (
                        <>
                            {/* Approve Button */}
                            <button
                                onClick={() => handleStatusChange('approved')}
                                disabled={isSubmitting || selectedAnnotation.status === 'approved'}
                                className={`${actionButtonBase} text-white ${selectedAnnotation.status === 'approved' ? 'bg-green-300 ' + disabledButtonClass : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'} ${isSubmitting ? disabledButtonClass : ''}`}
                            >
                                Approve
                            </button>
    
                            {/* Reject Button */}
                            <button
                                onClick={() => handleStatusChange('rejected')}
                                disabled={isSubmitting || selectedAnnotation.status === 'rejected'}
                                className={`${actionButtonBase} text-white ${selectedAnnotation.status === 'rejected' ? 'bg-orange-300 ' + disabledButtonClass : 'bg-orange-500 hover:bg-orange-600 focus:ring-yellow-400'} ${isSubmitting ? disabledButtonClass : ''}`}
                            >
                                Reject
                            </button>
    
                            {/* Edit Button */}
                            <button
                                onClick={() => setEditModal({ isOpen: true, annotation: selectedAnnotation })}
                                disabled={isSubmitting}
                                className={`${actionButtonBase} text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-blue-500 ${isSubmitting ? disabledButtonClass : ''}`}
                            >
                                Edit
                            </button>
    
                            {/* Delete Button */}
                            <button
                                onClick={() => setDeleteModal({ isOpen: true, annotationId: selectedAnnotation.id! })}
                                disabled={isSubmitting}
                                className={`${actionButtonBase} text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 ${isSubmitting ? disabledButtonClass : ''}`}
                            >
                                Delete
                            </button>
                        </>
                    ) : selectedAnnotation.createdBy?.userId === userId ? (
                        <>
                            {/* Edit Button */}
                            <button
                                onClick={() => setEditModal({ isOpen: true, annotation: selectedAnnotation })}
                                disabled={isSubmitting}
                                className={`${actionButtonBase} text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-blue-500 ${isSubmitting ? disabledButtonClass : ''}`}
                            >
                                Edit
                            </button>
    
                            {/* Delete Button */}
                            <button
                                onClick={() => setDeleteModal({ isOpen: true, annotationId: selectedAnnotation.id! })}
                                disabled={isSubmitting}
                                className={`${actionButtonBase} text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 ${isSubmitting ? disabledButtonClass : ''}`}
                            >
                                Delete
                            </button>
                        </>
                    ) : null}
                </div>
            </div>
    
            {/* Modals */}
            <DeleteConfirmationModal />
            <EditAnnotationModal />
        </div>
    );
}