import  { useState } from 'react';
// Props include: isOpen, onClose, onSubmit, fields (array of {name, label, type, initialValue}), initialData
const FormModal = ({ isOpen, onClose, onSubmit, title, fields, initialData = {} }) => {
const [formData, setFormData] = useState(() => {
    return fields.reduce((acc, field) => {
      acc[field.name] = initialData[field.name] ?? field.initialValue ?? '';
      return acc;
    }, {});
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose(); // Close on successful submit
  };
  
  return (
    // Modal Overlay (reusing the styling approach from ConfirmationModal)
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="form-modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-xl leading-6 font-medium text-gray-900 mb-6" id="form-modal-title">
                {title}
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {fields.map((field) => (
                  <div key={field.name}>
                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    <input
                      type={field.type || 'text'}
                      name={field.name}
                      id={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleChange}
                      required={field.required}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Save Changes
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormModal;