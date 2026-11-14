import React, { useId } from 'react';
import { FiUploadCloud, FiEdit2, FiTrash2 } from 'react-icons/fi';

function UploadFileField({
  fileInputRef,
  attachment,
  accept,
  maxSizeMb,
  onFileSelect,
  onRemoveFile,
  error,
  disabled = false,
  label = 'Upload a file',
  dropLabel = 'Click or drop a file',
  helpText = 'Optional. Images show a preview before you send.',
  className = '',
}) {
  const inputId = useId();
  const helpId = useId();
  const openFileDialog = () => {
    if (!disabled) fileInputRef?.current?.click();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <section
      className={`${className} grid gap-y-2 ${disabled ? 'opacity-50' : ''}`}
    >
      <label
        htmlFor={inputId}
        className='block text-center text-sm font-medium'
      >
        {label}
      </label>

      {!attachment?.previewUrl && !attachment?.file && (
        <div
          className={`paper-aged grid w-full place-items-center gap-1 rounded-md border-2 border-dashed border-poster-brown p-4 text-center text-sm font-semibold text-poster-ink shadow-paper transition hover:brightness-105 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={openFileDialog}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          role='button'
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled || undefined}
          aria-label='Click or drop a file to upload'
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              openFileDialog();
            }
          }}
        >
          <FiUploadCloud className='justify-self-center text-xl' />
          <span>
            {dropLabel}{maxSizeMb ? ` (max ${maxSizeMb}MB)` : ''}
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type='file'
        id={inputId}
        name='attachment'
        onChange={handleInputChange}
        accept={accept}
        disabled={disabled}
        className='hidden'
        aria-describedby={helpId}
      />

      {attachment?.file && (
        <div className='grid gap-2'>
          {attachment.file.type.startsWith('image/') &&
          attachment.previewUrl ? (
            <img
              src={attachment.previewUrl}
              alt='Selected attachment preview'
              className='h-auto w-full rounded-md border-2 border-solid border-poster-brown'
            />
          ) : (
            <div className='rounded-md border-2 border-solid border-poster-brown p-2 text-sm'>
              Selected file: <strong>{attachment.file.name}</strong>
            </div>
          )}

          <div className='grid grid-flow-col auto-cols-max gap-2 justify-start'>
            <button
              type='button'
              onClick={openFileDialog}
              disabled={disabled}
              className='btn-paper grid-flow-col auto-cols-max gap-2'
              title='Change file'
              aria-label='Change uploaded file'
            >
              <FiEdit2 />
              <span>Change</span>
            </button>

            <button
              type='button'
              onClick={onRemoveFile}
              disabled={disabled}
              className='btn-paper grid-flow-col auto-cols-max gap-2'
              title='Remove file'
              aria-label='Remove uploaded file'
            >
              <FiTrash2 />
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}

      <div className='pt-1'>
        <p id={helpId} className='text-xs opacity-80'>
          {helpText}
        </p>
      </div>

      {error ? <p className='text-status-critical text-xs italic'>{error}</p> : null}
    </section>
  );
}

export default UploadFileField;
