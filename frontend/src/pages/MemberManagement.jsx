import { useEffect, useState, useCallback } from 'react'; 
import DataTable from '../components/reusable/DataTable';
import ConfirmationModal from '../components/reusable/ConfirmationModal';
import FormModal from '../components/reusable/FormModal'; 
import { useToast } from '../hooks/useToast'; 
import { getMembers, deactivateMember, searchMembers, updateMember, addMember } from '../services/memberService'; 

const MemberManagement = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search States
  const [searchQuery, setSearchQuery] = useState(''); 
  const [debouncedQuery, setDebouncedQuery] = useState(''); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null); 
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editMemberData, setEditMemberData] = useState(null); 

  const { showToast } = useToast(); 
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500); // Wait 500ms after typing stops

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadMembers = useCallback(async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = query 
        ? await searchMembers(query) 
        : await getMembers();
        
      const normalizedData = data.map(member => ({
        ...member,
        name: `${member.first_name} ${member.last_name}`,
        joinDate: new Date(member.join_date).toLocaleDateString(),
        memberId: member.member_id || member.memberId,
        phone_number: member.phone_number, 
      }));
      
      setMembers(normalizedData);
    } catch (err) {
      setError('Failed to fetch member data. Check API connection.');
      showToast({ message: 'Failed to fetch member data.', type: 'error' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showToast]); 

  // Fetch when DEBOUNCED query changes
  useEffect(() => {
    loadMembers(debouncedQuery);
  }, [loadMembers, debouncedQuery]); 
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value); 
  };
  const handleAddMemberClick = () => {
    setEditMemberData({
      isNew: true, 
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '', 
    });
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (member) => {
    setModalData({
      memberId: member.memberId, 
      name: member.name,
      title: 'Confirm Member Deactivation',
      message: `Are you sure you want to deactivate member: ${member.name}?`,
      isDestructive: true
    });
    setIsModalOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    setIsModalOpen(false);
    setLoading(true);
    try {
      await deactivateMember(modalData.memberId);
      showToast({ message: `Member ${modalData.name} successfully deactivated.`, type: 'success' });
      setError(null); 
      loadMembers(debouncedQuery);
    } catch (err) {
      const conflictMessage = err.response?.data?.message || 'Error deactivating member.';
      setError(conflictMessage);
      showToast({ message: conflictMessage, type: 'error' });
      setLoading(false);
    }
  };

  
  const handleEditClick = (member) => {
    setEditMemberData({
      memberId: member.memberId,
      first_name: member.first_name, 
      last_name: member.last_name,   
      email: member.email,
      phone_number: member.phone_number,
    });
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsFormModalOpen(false);
    setLoading(true);
    setError(null);
    
    const isNew = editMemberData.isNew; 
    const memberId = formData.memberId;

    const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number
    };

    try {
        if (isNew) {
            await addMember(payload);
            showToast({ message: 'New Member added successfully!', type: 'success' });
        } else {
            await updateMember(memberId, payload); 
            showToast({ message: 'Member details updated successfully!', type: 'success' });
        }
        loadMembers(debouncedQuery); 
    } catch (err) {
        const action = isNew ? 'add new member' : 'update member details';
        const errMsg = err.response?.data?.message || `Failed to ${action}. Check API or data.`;
        showToast({ message: errMsg, type: 'error' });
        setError(errMsg);
        setLoading(false);
    }
  };

  const columns = [
    { header: 'ID', key: 'memberId' }, 
    { header: 'Name', key: 'name' },
    { header: 'Email', key: 'email' },
    { header: 'Joined Date', key: 'joinDate' },
    { 
      header: 'Actions', 
      key: 'actions',
      render: (row) => (
        <div className="flex space-x-2">
            <button onClick={() => handleEditClick(row)} className="text-indigo-600 hover:text-indigo-900 text-xs font-medium">View/Edit</button>
            <button onClick={() => handleDeleteClick(row)} className="text-red-600 hover:text-red-900 text-xs font-medium">Deactivate</button>
        </div>
      )
    },
  ];

  return (
    <div>
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Member Management</h2>
      
      {/*Search Bar is now ALWAYS rendered, so focus is never lost */}
      <div className="mb-6 flex space-x-4">
        <input
          type="text"
          placeholder="Search active members by Name or ID..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button onClick={handleAddMemberClick} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          Add New Member
        </button> 
      </div>

      {error && <div className="text-red-600 bg-red-50 p-4 rounded-lg mb-4">{error}</div>}
      
      {/* CONDITIONAL LOADING: Only the table area shows loading */}
      {loading && members.length === 0 ? (
        <div className="text-center p-10 text-indigo-700">Loading Members...</div>
      ) : (
        <DataTable 
          data={members} 
          columns={columns} 
          title="Active Members"
        />
      )}
      
      {modalData && (
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmDeactivate}
          title={modalData.title}
          message={modalData.message}
          confirmText="Yes, Deactivate"
          isDestructive={modalData.isDestructive}
        />
      )}

      {isFormModalOpen && editMemberData && (
        <FormModal
          key={editMemberData.memberId}
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSubmit={handleFormSubmit}
          title={editMemberData.isNew ? "Add New Member" : "Edit Member Details"}
          initialData={editMemberData}
          fields={[
            !editMemberData.isNew && { name: 'memberId', label: 'Member ID', type: 'text', readOnly: true },
            { name: 'first_name', label: 'First Name', type: 'text', required: true },
            { name: 'last_name', label: 'Last Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone_number', label: 'Phone Number', type: 'tel', required: true },
          ].filter(Boolean)}
        />
      )}
    </div>
  );
};

export default MemberManagement;