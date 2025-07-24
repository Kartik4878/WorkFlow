const mainContent = document.getElementById('main-content');
const navDashboard = document.getElementById('nav-dashboard');
const API_BASE = 'http://localhost:3000';
let allCasesData = [];
let myAssignmentsData = [];
let myWorkQueuesData = [];
let mySessionsData = [];
const ITEMS_PER_PAGE = 10;
let currentPage = {
  allCases: 1,
  myWork: 1,
  myWorkQueues: 1,
  mySessions: 1
};

if (!localStorage.getItem('userId')) {
  renderLoginScreen();
} else {
  loadDashboard();
  renderUserAvatar();
}

function renderUserAvatar() {
  const userId = localStorage.getItem('userId');
  const initials = getInitials(userId);
  
  document.getElementById("nav-header").innerHTML += `
    <div class="relative">
      <button id="avatar-button" class="w-10 h-10 rounded-full bg-yellow-500 text-gray-900 font-medium flex items-center justify-center focus:outline-none">
        ${initials}
      </button>
      <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
        <div class="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
          Signed in as <span class="font-medium">${userId}</span>
        </div>
        <a href="#" class="block px-4 py-2 text-sm text-red-700 hover:bg-gray-100" onclick="signOut()">
          Sign Out
        </a>
      </div>
    </div>
  `;
  
  // Add event listener for avatar click
  document.getElementById('avatar-button').addEventListener('click', toggleUserDropdown);
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    const avatarButton = document.getElementById('avatar-button');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (avatarButton && userDropdown && e.target !== avatarButton && !avatarButton.contains(e.target)) {
      userDropdown.classList.add('hidden');
    }
  });
}

function getInitials(name) {
  if (!name) return '?';
  
  // Split by spaces, dashes, underscores, or dots
  const parts = name.split(/[\s-_.]+/);
  
  if (parts.length === 1) {
    // If only one part, take first two characters
    return name.substring(0, 1).toUpperCase();
  } else {
    // Otherwise take first character of first two parts
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }
}

function toggleUserDropdown() {
  const dropdown = document.getElementById('user-dropdown');
  dropdown.classList.toggle('hidden');
}

function renderLoginScreen() {
  mainContent.innerHTML = `
    <div class="max-w-md mx-auto mt-20 bg-white p-8 shadow-lg rounded-lg border-t-4 border-yellow-400">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">Login</h2>
      <form id="login-form">
        <div class="mb-5">
          <label class="block font-medium text-gray-700 mb-1">User ID</label>
          <input type="text" name="userId" class="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent" required />
        </div>
        <div class="mb-6">
          <label class="block font-medium text-gray-700 mb-1">Password</label>
          <input type="password" name="password" class="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent" required />
        </div>
        <button type="submit" class="cba-yellow text-gray-900 px-5 py-2 rounded-md font-medium hover:bg-yellow-500 transition duration-200 w-full">Login</button>
      </form>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const userId = e.target.userId.value;
    const password = e.target.password.value;
    
    // Call the API to validate the user
    fetch(`${API_BASE}/operators/operator`, {
      headers: {
        'x-user-id': userId
      }
    })
    .then(res => {
      if (!res.ok) {
        throw new Error('Invalid user id or password');
      }
      return res.json();
    })
    .then(data => {
      // If successful, store userId and proceed
      localStorage.setItem('userId', userId);
      localStorage.setItem('role',data.role);
      renderUserAvatar();
      loadDashboard();
    })
    .catch(error => {
      // Show static error message
      const loginForm = document.getElementById('login-form');
      
      // Remove any existing error message
      const existingError = document.querySelector('.login-error');
      if (existingError) {
        existingError.remove();
      }
      
      // Add error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 login-error';
      errorDiv.innerHTML = `
        <p class="font-bold">Error</p>
        <p>Invalid User ID or Password</p>
      `;
      loginForm.insertAdjacentElement('beforebegin', errorDiv);
    });
  });
}

navDashboard.addEventListener('click', loadDashboard);

function loadDashboard() {
  // Check user role
  const userRole = localStorage.getItem('role');
  
  // If user is Admin, show the Admin dashboard
  if (userRole === "Admin") {
    renderAdminDashboard();
    return;
  }
  
  // Otherwise show the regular User dashboard
  // First check if we have sessions to determine if we should show the Sessions tab
  fetch(`${API_BASE}/sessions?t=${new Date().getTime()}`, {
    headers: {
      'x-user-id': localStorage.getItem('userId')
    }
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(sessions => {
      // Store sessions data
      mySessionsData = sessions;
      
      // Create tabbed interface structure
      mainContent.innerHTML = `
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-2xl font-bold text-gray-800">Cases Dashboard</h2>
          <div class="flex gap-4">
            <button class="cba-yellow text-gray-900 px-5 py-2 rounded-md font-medium hover:bg-yellow-500 transition duration-200 flex items-center" onclick="openCreateCasePopup()">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              Create Case
            </button>
          </div>
        </div>
        
        <!-- Tabs Navigation -->
        <div class="mb-4 border-b border-gray-200">
          <ul class="flex flex-wrap -mb-px text-sm font-medium text-center">
            ${sessions.length > 0 ? `
            <li class="mr-2">
              <a href="#" id="tab-my-sessions" class="inline-block p-4 border-b-2 border-yellow-400 rounded-t-lg active text-gray-900 font-semibold" aria-current="page">My Sessions</a>
            </li>
            ` : ''}
            <li class="mr-2">
              <a href="#" id="tab-my-work" class="inline-block p-4 border-b-2 ${sessions.length > 0 ? 'border-transparent hover:text-gray-600 hover:border-gray-300' : 'border-yellow-400 text-gray-900 font-semibold'}" ${sessions.length === 0 ? 'aria-current="page"' : ''}>My Work</a>
            </li>
            <li class="mr-2">
              <a href="#" id="tab-my-workqueues" class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300">My WorkQueues</a>
            </li>
            <li class="mr-2">
              <a href="#" id="tab-all-cases" class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300">All Cases</a>
            </li>
          </ul>
        </div>
        
        <!-- Tab Content -->
        <div id="tab-content"></div>
      `;

      // Add event listeners for tab switching
      if (sessions.length > 0) {
        document.getElementById('tab-my-sessions').addEventListener('click', function(e) {
          e.preventDefault();
          setActiveTab('tab-my-sessions');
          renderMySessions(mySessionsData);
        });
      }
      
      document.getElementById('tab-all-cases').addEventListener('click', function(e) {
        e.preventDefault();
        setActiveTab('tab-all-cases');
        loadAllCases();
      });
      
      document.getElementById('tab-my-work').addEventListener('click', function(e) {
        e.preventDefault();
        setActiveTab('tab-my-work');
        loadMyAssignments();
      });
      
      document.getElementById('tab-my-workqueues').addEventListener('click', function(e) {
        e.preventDefault();
        setActiveTab('tab-my-workqueues');
        loadMyWorkQueues();
      });
      
      // Load default tab
      if (sessions.length > 0) {
        renderMySessions(sessions);
      } else {
        loadMyAssignments();
      }
    })
    .catch(() => {
      // If there's an error fetching sessions, just show the default tabs without the sessions tab
      mainContent.innerHTML = `
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-2xl font-bold text-gray-800">Cases Dashboard</h2>
          <div class="flex gap-4">
            <button class="cba-yellow text-gray-900 px-5 py-2 rounded-md font-medium hover:bg-yellow-500 transition duration-200 flex items-center" onclick="openCreateCasePopup()">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              Create Case
            </button>
          </div>
        </div>
        
        <!-- Tabs Navigation -->
        <div class="mb-4 border-b border-gray-200">
          <ul class="flex flex-wrap -mb-px text-sm font-medium text-center">
            <li class="mr-2">
              <a href="#" id="tab-my-work" class="inline-block p-4 border-b-2 border-yellow-400 rounded-t-lg active text-gray-900 font-semibold" aria-current="page">My Work</a>
            </li>
            <li class="mr-2">
              <a href="#" id="tab-my-workqueues" class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300">My WorkQueues</a>
            </li>
            <li class="mr-2">
              <a href="#" id="tab-all-cases" class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300">All Cases</a>
            </li>
          </ul>
        </div>
        
        <!-- Tab Content -->
        <div id="tab-content"></div>
      `;

      // Add event listeners for tab switching
      document.getElementById('tab-all-cases').addEventListener('click', function(e) {
        e.preventDefault();
        setActiveTab('tab-all-cases');
        loadAllCases();
      });
      
      document.getElementById('tab-my-work').addEventListener('click', function(e) {
        e.preventDefault();
        setActiveTab('tab-my-work');
        loadMyAssignments();
      });
      
      document.getElementById('tab-my-workqueues').addEventListener('click', function(e) {
        e.preventDefault();
        setActiveTab('tab-my-workqueues');
        loadMyWorkQueues();
      });
      
      // Load My Work tab by default
      loadMyAssignments();
    });
}

// Function to render the Admin dashboard
function renderAdminDashboard() {
  // Create Admin dashboard UI with tabs for "All Case types" and "All operators"
  mainContent.innerHTML = `
    <div class="flex justify-between items-center mb-8">
      <h2 class="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
      <div>
        <button id="add-case-type-btn" class="cba-yellow text-gray-900 px-5 py-2 rounded-md font-medium hover:bg-yellow-500 transition duration-200 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Add Case Type
        </button>
      </div>
    </div>
    
    <!-- Tabs Navigation -->
    <div class="mb-4 border-b border-gray-200">
      <ul class="flex flex-wrap -mb-px text-sm font-medium text-center">
        <li class="mr-2">
          <a href="#" id="tab-case-types" class="inline-block p-4 border-b-2 border-yellow-400 rounded-t-lg active text-gray-900 font-semibold" aria-current="page">All Case types</a>
        </li>
        <li class="mr-2">
          <a href="#" id="tab-operators" class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300">All Operators</a>
        </li>
      </ul>
    </div>
    
    <!-- Tab Content -->
    <div id="tab-content"></div>
  `;
  
  // Load case types data by default
  loadCaseTypes();
  
  // Add event listener for the Add Case Type button
  document.getElementById('add-case-type-btn').addEventListener('click', createNewCaseType);
  
  // Add event listeners for tab switching
  document.getElementById('tab-case-types').addEventListener('click', function(e) {
    e.preventDefault();
    setActiveAdminTab('tab-case-types');
    loadCaseTypes();
  });
  
  document.getElementById('tab-operators').addEventListener('click', function(e) {
    e.preventDefault();
    setActiveAdminTab('tab-operators');
    loadOperators();
  });
}

// Function to set active tab in admin dashboard
function setActiveAdminTab(activeTabId) {
  const tabIds = ['tab-case-types', 'tab-operators'];
  
  tabIds.forEach(tabId => {
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
      if (tabId === activeTabId) {
        tabElement.classList.add('border-yellow-400', 'text-gray-900', 'font-semibold');
        tabElement.classList.remove('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
      } else {
        tabElement.classList.remove('border-yellow-400', 'text-gray-900', 'font-semibold');
        tabElement.classList.add('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
      }
    }
  });
}

// Function to load operators data
function loadOperators() {
  fetch(`${API_BASE}/operators`, {
    headers: {
      'x-user-id': localStorage.getItem('userId')
    }
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(operators => {
      renderOperators(operators);
    })
    .catch(() => {
      const tabContent = document.getElementById('tab-content');
      tabContent.innerHTML = `
        <div class="bg-white p-6 shadow-md rounded-lg text-center">
          <p class="text-gray-500">Error loading operators data.</p>
        </div>
      `;
    });
}

// Function to render operators table
function renderOperators(operators) {
  const tabContent = document.getElementById('tab-content');
  
  tabContent.innerHTML = `
    <div id="operators-container">
      <div class="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr class="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th class="py-3 px-6">User Name</th>
              <th class="py-3 px-6">Operator ID</th>
              <th class="py-3 px-6">Work Groups</th>
              <th class="py-3 px-6">Work Queues</th>
              <th class="py-3 px-6">Role</th>
              <th class="py-3 px-6">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${operators.length > 0 ? operators.map(operator => `
              <tr class="hover:bg-gray-50 transition duration-150">
                <td class="py-4 px-6 font-medium text-gray-900">${operator.UserName}</td>
                <td class="py-4 px-6 text-gray-500">${operator.OperatorID}</td>
                <td class="py-4 px-6 text-gray-500">${operator.WorkGroups ? operator.WorkGroups.join(', ') : ''}</td>
                <td class="py-4 px-6 text-gray-500">${operator.workQueues ? operator.workQueues.join(', ') : ''}</td>
                <td class="py-4 px-6 text-gray-500">${operator.role || ''}</td>
                <td class="py-4 px-6">
                  <button onclick='openEditOperatorPopup(${JSON.stringify(operator).replace(/'/g, "\\'")})' class="text-blue-600 hover:text-blue-900">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="6" class="py-4 px-6 text-center text-gray-500">No operators found.</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Function to open edit operator popup
function openEditOperatorPopup(operator) {
  // Create the popup overlay
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50';
  
  // Create the popup content
  overlay.innerHTML = `
    <div class="bg-white p-8 rounded-lg shadow-xl w-96 max-w-md">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-gray-800">Edit Operator: ${operator.OperatorID}</h3>
        <button onclick="document.querySelector('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <form id="edit-operator-form">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">User Name</label>
          <input type="text" name="UserName" value="${operator.UserName}" class="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select name="role" class="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
            <option value="User" ${operator.role === 'User' ? 'selected' : ''}>User</option>
            <option value="Admin" ${operator.role === 'Admin' ? 'selected' : ''}>Admin</option>
          </select>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Work Groups (comma-separated)</label>
          <input type="text" name="WorkGroups" value="${operator.WorkGroups ? operator.WorkGroups.join(', ') : ''}" class="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
          <p class="text-xs text-gray-500 mt-1">Enter multiple values separated by commas</p>
        </div>
        
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-1">Work Queues (comma-separated)</label>
          <input type="text" name="workQueues" value="${operator.workQueues ? operator.workQueues.join(', ') : ''}" class="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
          <p class="text-xs text-gray-500 mt-1">Enter multiple values separated by commas</p>
        </div>
        
        <div class="flex justify-end space-x-3">
          <button type="button" onclick="document.querySelector('.fixed').remove()" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium transition duration-200">
            Cancel
          </button>
          <button type="button" onclick="saveOperatorChanges('${operator.OperatorID}')" class="cba-yellow text-gray-900 px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition duration-200">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  `;
  
  // Add the popup to the document
  document.body.appendChild(overlay);
}

// Function to save operator changes
function saveOperatorChanges(operatorId) {
  const form = document.getElementById('edit-operator-form');
  
  // Get form values
  const userName = form.elements.UserName.value;
  const role = form.elements.role.value;
  
  // Convert comma-separated strings to arrays
  const workGroups = form.elements.WorkGroups.value
    .split(',')
    .map(item => item.trim())
    .filter(item => item !== '');
    
  const workQueues = form.elements.workQueues.value
    .split(',')
    .map(item => item.trim())
    .filter(item => item !== '');
  
  // Create the updated operator object
  const updatedOperator = {
    UserName: userName,
    role: role,
    WorkGroups: workGroups,
    workQueues: workQueues,
    OperatorID: operatorId
  };
  
  // Send the update request
  fetch(`${API_BASE}/operators/${operatorId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('userId')
    },
    body: JSON.stringify(updatedOperator)
  })
    .then(res => {
      if (!res.ok) {
        throw new Error('Failed to update operator');
      }
      return res.json();
    })
    .then(() => {
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50';
      successMessage.innerHTML = `
        <div class="flex">
          <div class="py-1">
            <svg class="h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Success!</p>
            <p class="text-sm">Operator details have been updated successfully.</p>
          </div>
        </div>
      `;
      document.body.appendChild(successMessage);
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
      
      // Close the popup
      document.querySelector('.fixed').remove();
      
      // Reload operators data to reflect changes
      loadOperators();
    })
    .catch(error => {
      // Show error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md z-50';
      errorMessage.innerHTML = `
        <div class="flex">
          <div class="py-1">
            <svg class="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Error</p>
            <p class="text-sm">${error.message || "There was an error while updating the operator details."}</p>
          </div>
        </div>
      `;
      document.body.appendChild(errorMessage);
      
      // Remove error message after 5 seconds
      setTimeout(() => {
        errorMessage.remove();
      }, 5000);
    });
}

// Function to load case types
function loadCaseTypes() {
  fetch(`${API_BASE}/cases/types`, {
    headers: {
      'x-user-id': localStorage.getItem('userId')
    }
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(caseTypes => {
      renderCaseTypes(caseTypes);
    })
    .catch(() => {
      const tabContent = document.getElementById('tab-content');
      tabContent.innerHTML = `
        <div class="bg-white p-6 shadow-md rounded-lg text-center">
          <p class="text-gray-500">Error loading case types.</p>
        </div>
      `;
    });
}

// Function to render case types table
function renderCaseTypes(caseTypes) {
  const tabContent = document.getElementById('tab-content');
  
  tabContent.innerHTML = `
    <div id="case-types-container">
      <div class="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr class="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th class="py-3 px-6">Case Types</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${caseTypes.length > 0 ? caseTypes.map(caseType => `
              <tr class="cursor-pointer hover:bg-gray-50 transition duration-150" onclick="loadCaseTypeSchema('${caseType}')">
                <td class="py-4 px-6 font-medium text-gray-900">${caseType}</td>
              </tr>
            `).join('') : `
              <tr>
                <td class="py-4 px-6 text-center text-gray-500">No case types found.</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
    <div id="schema-details-container" class="hidden"></div>
  `;
}

// Function to load case type schema
function loadCaseTypeSchema(schemaId) {
  fetch(`${API_BASE}/cases/types/${schemaId}`, {
    headers: {
      'x-user-id': localStorage.getItem('userId')
    }
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(schemaData => {
      // Hide the case types table
      document.getElementById('case-types-container').classList.add('hidden');
      renderCaseTypeSchema(schemaData, schemaId);
    })
    .catch(() => {
      const schemaContainer = document.getElementById('schema-details-container');
      schemaContainer.classList.remove('hidden');
      document.getElementById('case-types-container').classList.add('hidden');
      schemaContainer.innerHTML = `
        <div class="bg-white p-6 shadow-md rounded-lg text-center">
          <p class="text-gray-500">Error loading schema details.</p>
          <button class="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium transition duration-200" onclick="backToCaseTypes()">
            Back to Case Types
          </button>
        </div>
      `;
    });
}

// Function to go back to case types table
function backToCaseTypes() {
  document.getElementById('case-types-container').classList.remove('hidden');
  document.getElementById('schema-details-container').classList.add('hidden');
}

// Add CSS for edit mode
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .view-mode.hidden, .edit-mode.hidden {
      display: none;
    }
    .edit-mode input, .edit-mode select, .edit-mode textarea {
      width: 100%;
      padding: 0.25rem 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      margin-bottom: 0.5rem;
    }
  </style>
`);

// Function to render case type schema in card layout
function renderCaseTypeSchema(schema, schemaId) {
  const schemaContainer = document.getElementById('schema-details-container');
  schemaContainer.classList.remove('hidden');
  
  // Store the original schema in a global variable for edit mode
  window.originalSchema = JSON.parse(JSON.stringify(schema));
  window.currentEditMode = false;
  
  // Create header section with back button and edit button
  let html = `
    <div id="schema-card" class="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 mb-6">
      <div class="p-6 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <div class="flex items-center">
            <button class="mr-3 bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded-md transition duration-200" onclick="backToCaseTypes()">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
              </svg>
            </button>
            <div id="schema-label-view" class="view-mode">
              <h2 class="text-xl font-bold text-gray-800">${schema.label}</h2>
            </div>
            <div id="schema-label-edit" class="edit-mode hidden">
              <input type="text" class="border border-gray-300 rounded-md px-2 py-1 text-xl font-bold" value="${schema.label}">
            </div>
          </div>
          <div class="flex items-center">
            <div id="status-badge-view" class="view-mode">
              <span class="px-3 py-1 rounded-full text-sm font-medium ${getBadgeClass(schema.resolvedStatus)}">${schema.resolvedStatus}</span>
            </div>
            <div id="status-badge-edit" class="edit-mode hidden mr-3">
              <select class="border border-gray-300 rounded-md px-2 py-1">
                <option value="Resolved" ${schema.resolvedStatus === 'Resolved' ? 'selected' : ''}>Resolved</option>
                <option value="InProgress" ${schema.resolvedStatus === 'InProgress' ? 'selected' : ''}>InProgress</option>
                <option value="Review" ${schema.resolvedStatus === 'Review' ? 'selected' : ''}>Review</option>
                <option value="Failed" ${schema.resolvedStatus === 'Failed' ? 'selected' : ''}>Failed</option>
              </select>
            </div>
            <button id="edit-button" class="view-mode ml-3 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md font-medium transition duration-200 flex items-center text-sm" onclick="toggleEditMode('${schemaId}')">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-10 10a2 2 0 01-1.414.586H4V15a2 2 0 01.586-1.414l10-10z" />
              </svg>
              Edit
            </button>
            <div id="edit-actions" class="edit-mode hidden">
              <button class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md font-medium transition duration-200 flex items-center text-sm mr-2" onclick="saveSchemaChanges('${schemaId}')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Save
              </button>
              <button class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md font-medium transition duration-200 flex items-center text-sm" onclick="cancelEdit()">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                Cancel
              </button>
            </div>
          </div>
        </div>
        <div class="mt-1">
          <div id="schema-id-view" class="view-mode">
            <p class="text-gray-500">ID: ${schema.rpl}</p>
          </div>
          <div id="schema-id-edit" class="edit-mode hidden">
            <label class="text-gray-500">ID:</label>
            <input type="text" class="border border-gray-300 rounded-md px-2 py-1 ml-1" value="${schema.rpl}">
          </div>
        </div>
      </div>
  `;
  
  // Create process cards
  html += `<div class="p-6" id="processes-container">`;
  
  // Loop through each process
  Object.entries(schema.processes).forEach(([processKey, process], processIndex) => {
    // Check if this is the first process
    const isFirstProcess = processIndex === 0;
    
    html += `
      <div class="mb-6 ${processIndex > 0 ? 'mt-8 pt-6 border-t border-gray-200' : ''}" id="process-${processKey}">
        <div class="flex justify-between items-center mb-4">
          <div class="view-mode">
            <h3 class="text-lg font-semibold text-gray-700">${processKey}</h3>
          </div>
          <div class="edit-mode hidden">
            <input type="text" class="border border-gray-300 rounded-md px-2 py-1 text-lg font-semibold" value="${processKey}" data-original-key="${processKey}">
          </div>
          
          <div class="flex items-center">
            <div class="edit-mode hidden mr-2">
              <button type="button" class="text-red-500 hover:text-red-700" onclick="removeProcess('${processKey}')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div class="view-mode">
              <span class="px-2 py-1 rounded-full text-xs font-medium ${getBadgeClass(process.status)}">${process.status}</span>
            </div>
            <div class="edit-mode hidden">
              <select class="border border-gray-300 rounded-md px-2 py-1">
                <option value="InProgress" ${process.status === 'InProgress' ? 'selected' : ''}>InProgress</option>
                <option value="Review" ${process.status === 'Review' ? 'selected' : ''}>Review</option>
                <option value="Resolved" ${process.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                <option value="Failed" ${process.status === 'Failed' ? 'selected' : ''}>Failed</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="mb-4">
          <div class="view-mode">
            <p class="text-sm text-gray-600">Condition: <span class="font-mono text-xs bg-gray-100 px-2 py-1 rounded">${process.condition || ""}</span></p>
          </div>
          <div class="edit-mode hidden">
            <label class="block text-sm text-gray-600 mb-1">Condition:</label>
            <input type="text" class="border border-gray-300 rounded-md px-2 py-1 w-full font-mono text-sm" value="${process.condition || ""}" placeholder="Enter condition expression" ${isFirstProcess ? 'disabled' : ''}>
            ${isFirstProcess ? '<p class="text-xs text-gray-500 mt-1">Condition is disabled for the first process</p>' : ''}
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="assignments-${processKey}">
    `;
    
    // Loop through assignments in this process
    process.assignments.forEach((assignmentId, assignmentIndex) => {
      const assignmentConfig = process.assignmentConfigs[assignmentId];
      if (!assignmentConfig) return;
      
      // Check if this is the first assignment of the first process
      const isFirstAssignmentOfFirstProcess = isFirstProcess && assignmentIndex === 0;
      
      html += `
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200" id="assignment-${assignmentId}">
          <div class="flex justify-between items-center mb-3">
            <div class="view-mode">
              <h4 class="font-medium text-gray-800">${assignmentConfig.label || assignmentId}</h4>
            </div>
            <div class="edit-mode hidden">
              <input type="text" class="border border-gray-300 rounded-md px-2 py-1" value="${assignmentConfig.label || assignmentId}">
            </div>
            
            <div class="flex items-center">
              <div class="edit-mode hidden mr-2">
                <button type="button" class="text-red-500 hover:text-red-700" onclick="removeAssignment('${processKey}', '${assignmentId}')">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div class="view-mode">
                <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                  ${assignmentConfig.routeToType}: ${assignmentConfig.routeTo}
                </span>
              </div>
              <div class="edit-mode hidden">
                <select class="border border-gray-300 rounded-md px-2 py-1 mr-2" id="route-type-${assignmentId}">
                  <option value="Operator" ${assignmentConfig.routeToType === 'Operator' ? 'selected' : ''}>Operator</option>
                  <option value="WorkQueue" ${assignmentConfig.routeToType === 'WorkQueue' ? 'selected' : ''}>WorkQueue</option>
                </select>
                <input type="text" class="border border-gray-300 rounded-md px-2 py-1" value="${assignmentConfig.routeTo}">
              </div>
            </div>
          </div>
          
          <div class="mb-3">
            <div class="view-mode">
              <p class="text-sm text-gray-600">Condition: <span class="font-mono text-xs bg-gray-100 px-2 py-1 rounded">${assignmentConfig.condition || ""}</span></p>
            </div>
            <div class="edit-mode hidden">
              <label class="block text-sm text-gray-600 mb-1">Condition:</label>
              <input type="text" class="border border-gray-300 rounded-md px-2 py-1 w-full font-mono text-sm" value="${assignmentConfig.condition || ""}" placeholder="Enter condition expression" ${isFirstAssignmentOfFirstProcess ? 'disabled' : ''}>
              ${isFirstAssignmentOfFirstProcess ? '<p class="text-xs text-gray-500 mt-1">Condition is disabled for the first assignment of the first process</p>' : ''}
            </div>
          </div>
          
          <div class="space-y-3" id="properties-${assignmentId}">
            ${assignmentConfig.properties && assignmentConfig.properties.length > 0 ? assignmentConfig.properties.map((prop, propIndex) => `
              <div class="property-item" id="property-${assignmentId}-${propIndex}">
                <div class="view-mode">
                  <p class="text-sm font-medium text-gray-600">${prop.label}</p>
                  <p class="text-sm text-gray-800">
                    ${prop.value ? `Default: ${prop.value}` : ''}
                    ${prop.required ? '<span class="text-red-500 ml-1">*</span>' : ''}
                    <span class="text-gray-500 text-xs ml-2">(${prop.type})</span>
                  </p>
                </div>
                <div class="edit-mode hidden">
                  <div class="flex flex-wrap gap-2 mb-2">
                    <div class="flex-1">
                      <label class="text-xs text-gray-500">Label</label>
                      <input type="text" class="border border-gray-300 rounded-md px-2 py-1 w-full" value="${prop.label}">
                    </div>
                    <div class="w-24">
                      <label class="text-xs text-gray-500">Key</label>
                      <input type="text" class="border border-gray-300 rounded-md px-2 py-1 w-full" value="${prop.key}">
                    </div>
                    <div class="w-20">
                      <label class="text-xs text-gray-500">Type</label>
                      <select class="border border-gray-300 rounded-md px-2 py-1 w-full">
                        <option value="text" ${prop.type === 'text' ? 'selected' : ''}>text</option>
                        <option value="number" ${prop.type === 'number' ? 'selected' : ''}>number</option>
                        <option value="date" ${prop.type === 'date' ? 'selected' : ''}>date</option>
                      </select>
                    </div>
                    <div class="w-24">
                      <label class="text-xs text-gray-500">Default</label>
                      <input type="text" class="border border-gray-300 rounded-md px-2 py-1 w-full" value="${prop.value || ''}">
                    </div>
                    <div class="w-20">
                      <label class="text-xs text-gray-500">Required</label>
                      <select class="border border-gray-300 rounded-md px-2 py-1 w-full">
                        <option value="true" ${prop.required ? 'selected' : ''}>Yes</option>
                        <option value="false" ${!prop.required ? 'selected' : ''}>No</option>
                      </select>
                    </div>
                    <div class="w-8 flex items-end justify-center pb-1">
                      <button type="button" class="text-red-500 hover:text-red-700" onclick="removeProperty('${assignmentId}', ${propIndex})">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `).join('') : ''}
            <div class="edit-mode hidden">
              <button class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md text-xs" onclick="addProperty('${assignmentId}')">
                + Add Property
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
        <div class="edit-mode hidden mt-3">
          <button class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md text-xs" onclick="addAssignment('${processKey}')">
            + Add Assignment
          </button>
        </div>
      </div>
    `;
  });
  
  html += `
    <div class="edit-mode hidden mt-4">
      <button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm" onclick="addProcess()">
        + Add Process
      </button>
    </div>
  `;
  
  html += `</div></div>`;
  
  schemaContainer.innerHTML = html;
}

// Function to toggle edit mode
function toggleEditMode(schemaId) {
  window.currentEditMode = !window.currentEditMode;
  
  // Toggle visibility of view and edit elements
  const viewElements = document.querySelectorAll('.view-mode');
  const editElements = document.querySelectorAll('.edit-mode');
  
  viewElements.forEach(el => {
    el.classList.toggle('hidden');
  });
  
  editElements.forEach(el => {
    el.classList.toggle('hidden');
  });
}

// Function to cancel edit mode
function cancelEdit() {
  // Restore original schema
  if (window.originalSchema) {
    const schemaId = window.originalSchema.rpl;
    renderCaseTypeSchema(window.originalSchema, schemaId);
  } else {
    // Just toggle back to view mode if no original schema is available
    toggleEditMode();
  }
}

// Function to add a new property to an assignment
function addProperty(assignmentId) {
  const propertiesContainer = document.getElementById(`properties-${assignmentId}`);
  const newPropertyIndex = propertiesContainer.querySelectorAll('.property-item').length;
  
  const newPropertyHTML = `
    <div class="property-item edit-mode" id="property-${assignmentId}-${newPropertyIndex}">
      <div class="flex flex-wrap gap-2 mb-2">
        <div class="flex-1">
          <label class="text-xs text-gray-500">Label</label>
          <input type="text" class="border border-gray-300 rounded-md px-2 py-1 w-full" value="New Property">
        </div>
        <div class="w-24">
          <label class="text-xs text-gray-500">Key</label>
          <input type="text" class="border border-gray-300 rounded-md px-2 py-1 w-full" value="newProp">
        </div>
        <div class="w-20">
          <label class="text-xs text-gray-500">Type</label>
          <select class="border border-gray-300 rounded-md px-2 py-1 w-full">
            <option value="text" selected>text</option>
            <option value="number">number</option>
            <option value="date">date</option>
          </select>
        </div>
        <div class="w-24">
          <label class="text-xs text-gray-500">Default</label>
          <input type="text" class="border border-gray-300 rounded-md px-2 py-1 w-full" value="">
        </div>
        <div class="w-20">
          <label class="text-xs text-gray-500">Required</label>
          <select class="border border-gray-300 rounded-md px-2 py-1 w-full">
            <option value="true">Yes</option>
            <option value="false" selected>No</option>
          </select>
        </div>
        <div class="w-8 flex items-end justify-center pb-1">
          <button type="button" class="text-red-500 hover:text-red-700" onclick="removeProperty('${assignmentId}', ${newPropertyIndex})">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Insert before the "Add Property" button
  const addButton = propertiesContainer.querySelector('button').parentNode;
  addButton.insertAdjacentHTML('beforebegin', newPropertyHTML);
}

// Function to add a new assignment to a process
function addAssignment(processKey) {
  const assignmentsContainer = document.getElementById(`assignments-${processKey}`);
  const newAssignmentId = `A${Date.now().toString().slice(-4)}`;
  
  const newAssignmentHTML = `
    <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 edit-mode" id="assignment-${newAssignmentId}">
      <div class="flex justify-between items-center mb-3">
        <div>
          <input type="text" class="border border-gray-300 rounded-md px-2 py-1" value="New Assignment">
        </div>
        
        <div class="flex items-center">
          <button type="button" class="text-red-500 hover:text-red-700 mr-2" onclick="removeAssignment('${processKey}', '${newAssignmentId}')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <select class="border border-gray-300 rounded-md px-2 py-1 mr-2" id="route-type-${newAssignmentId}">
            <option value="Operator">Operator</option>
            <option value="WorkQueue" selected>WorkQueue</option>
          </select>
          <input type="text" class="border border-gray-300 rounded-md px-2 py-1" value="Default">
        </div>
      </div>
      
      <div class="mb-3">
        <label class="block text-sm text-gray-600 mb-1">Condition:</label>
        <input type="text" class="border border-gray-300 rounded-md px-2 py-1 w-full font-mono text-sm" value="" placeholder="Enter condition expression">
      </div>
      
      <div class="space-y-3" id="properties-${newAssignmentId}">
        <div class="edit-mode">
          <button class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md text-xs" onclick="addProperty('${newAssignmentId}')">
            + Add Property
          </button>
        </div>
      </div>
    </div>
  `;
  
  assignmentsContainer.insertAdjacentHTML('beforeend', newAssignmentHTML);
}

// Function to add a new process
function addProcess() {
  const processesContainer = document.getElementById('processes-container');
  const processCount = processesContainer.querySelectorAll('[id^="process-"]').length;
  const newProcessKey = `process${processCount + 1}`;
  
  const newProcessHTML = `
    <div class="mb-6 mt-8 pt-6 border-t border-gray-200 edit-mode" id="process-${newProcessKey}">
      <div class="flex justify-between items-center mb-4">
        <div>
          <input type="text" class="border border-gray-300 rounded-md px-2 py-1 text-lg font-semibold" value="${newProcessKey}" data-original-key="${newProcessKey}">
        </div>
        
        <div class="flex items-center">
          <button type="button" class="text-red-500 hover:text-red-700 mr-2" onclick="removeProcess('${newProcessKey}')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <select class="border border-gray-300 rounded-md px-2 py-1">
            <option value="InProgress" selected>InProgress</option>
            <option value="Review">Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm text-gray-600 mb-1">Condition:</label>
        <input type="text" class="border border-gray-300 rounded-md px-2 py-1 w-full font-mono text-sm" value="" placeholder="Enter condition expression">
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="assignments-${newProcessKey}">
      </div>
      <div class="mt-3">
        <button class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md text-xs" onclick="addAssignment('${newProcessKey}')">
          + Add Assignment
        </button>
      </div>
    </div>
  `;
  
  // Insert before the "Add Process" button
  const addButton = processesContainer.querySelector('button').parentNode;
  addButton.insertAdjacentHTML('beforebegin', newProcessHTML);
}

// Function to remove a property from an assignment
function removeProperty(assignmentId, propIndex) {
  const propertyElement = document.getElementById(`property-${assignmentId}-${propIndex}`);
  
  if (propertyElement) {
    // Ask for confirmation before removing
    if (confirm('Are you sure you want to remove this property?')) {
      propertyElement.remove();
    }
  }
}

// Function to remove an assignment from a process
function removeAssignment(processKey, assignmentId) {
  const assignmentElement = document.getElementById(`assignment-${assignmentId}`);
  
  if (assignmentElement) {
    // Ask for confirmation before removing
    if (confirm('Are you sure you want to remove this assignment?')) {
      assignmentElement.remove();
    }
  }
}

// Function to remove a process
function removeProcess(processKey) {
  const processElement = document.getElementById(`process-${processKey}`);
  
  if (processElement) {
    // Ask for confirmation before removing
    if (confirm('Are you sure you want to remove this process?')) {
      processElement.remove();
    }
  }
}

// Function to save schema changes
function saveSchemaChanges(schemaId) {
  // Start with the complete original schema and update it with form values
  const updatedSchema = JSON.parse(JSON.stringify(window.originalSchema));
  
  // Update the top-level properties
  updatedSchema.label = document.querySelector('#schema-label-edit input').value;
  updatedSchema.resolvedStatus = document.querySelector('#status-badge-edit select').value;
  updatedSchema.rpl = document.querySelector('#schema-id-edit input').value;
  
  // Create a new processes object to store the updated processes
  const updatedProcesses = {};
  
  // Collect process data - only from processes that still exist in the DOM
  const processElements = document.querySelectorAll('[id^="process-"]');
  processElements.forEach(processEl => {
    const processKey = processEl.querySelector('input[data-original-key]').value;
    const originalKey = processEl.querySelector('input[data-original-key]').getAttribute('data-original-key');
    
    // Create the process object with basic properties
    updatedProcesses[processKey] = {
      status: processEl.querySelector('select').value,
      condition: processEl.querySelector('input[placeholder="Enter condition expression"]').value,
      assignments: [],
      assignmentConfigs: {}
    };
    
    // Collect assignment data - only from assignments that still exist in the DOM
    const assignmentsContainer = document.getElementById(`assignments-${originalKey}`);
    const assignmentElements = assignmentsContainer.querySelectorAll('[id^="assignment-"]');
    
    assignmentElements.forEach(assignmentEl => {
      const assignmentId = assignmentEl.id.replace('assignment-', '');
      updatedProcesses[processKey].assignments.push(assignmentId);
      
      const inputs = assignmentEl.querySelectorAll('input, select');
      const label = inputs[0].value;
      const routeToType = inputs[1].value;
      const routeTo = inputs[2].value;
      
      // Get the condition value from the assignment
      const conditionInput = assignmentEl.querySelector('input[placeholder="Enter condition expression"]');
      const condition = conditionInput ? conditionInput.value : "";
      
      updatedProcesses[processKey].assignmentConfigs[assignmentId] = {
        label,
        routeToType,
        routeTo,
        condition,
        properties: []
      };
      
      // Collect property data - only from properties that still exist in the DOM
      const propertiesContainer = document.getElementById(`properties-${assignmentId}`);
      const propertyElements = propertiesContainer.querySelectorAll('.property-item');
      
      // Collect properties directly from the DOM elements
      propertyElements.forEach(propEl => {
        const propInputs = propEl.querySelectorAll('input, select');
        if (propInputs.length >= 5) {
          const property = {
            label: propInputs[0].value,
            key: propInputs[1].value,
            type: propInputs[2].value,
            value: propInputs[3].value || undefined,
            required: propInputs[4].value === 'true'
          };
          
          // Add the property to the assignment
          updatedProcesses[processKey].assignmentConfigs[assignmentId].properties.push(property);
        }
      });
    });
  });
  
  // Replace the processes object with our updated version
  updatedSchema.processes = updatedProcesses;
  
  // Send the complete updated schema to the server
  fetch(`${API_BASE}/cases/types/${schemaId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('userId')
    },
    body: JSON.stringify(updatedSchema)
  })
    .then(res => {
      if (!res.ok) {
        throw new Error('Failed to save schema changes');
      }
      return res.json();
    })
    .then(data => {
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50';
      successMessage.innerHTML = `
        <div class="flex">
          <div class="py-1">
            <svg class="h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Success!</p>
            <p class="text-sm">Schema changes have been saved successfully.</p>
          </div>
        </div>
      `;
      document.body.appendChild(successMessage);
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
      
      // Fetch the updated schema from the server to ensure we have the latest data
      fetch(`${API_BASE}/cases/types/${schemaId}`, {
        headers: {
          'x-user-id': localStorage.getItem('userId')
        }
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch updated schema');
          return res.json();
        })
        .then(freshSchema => {
          // Update the original schema with the fresh data from server
          window.originalSchema = freshSchema;
          // Re-render the schema with the fresh data
          renderCaseTypeSchema(freshSchema, schemaId);
        })
        .catch(error => {
          console.error('Error fetching updated schema:', error);
          // If fetch fails, still toggle back to view mode with local data
          window.originalSchema = updatedSchema;
          toggleEditMode();
        });
    })
    .catch(error => {
      // Show error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md z-50';
      errorMessage.innerHTML = `
        <div class="flex">
          <div class="py-1">
            <svg class="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Error</p>
            <p class="text-sm">${error.message || "There was an error while saving the schema changes."}</p>
          </div>
        </div>
      `;
      document.body.appendChild(errorMessage);
      
      // Remove error message after 5 seconds
      setTimeout(() => {
        errorMessage.remove();
      }, 5000);
    });
}

// Helper function to set the active tab
function setActiveTab(activeTabId) {
  const tabIds = ['tab-my-sessions', 'tab-my-work', 'tab-my-workqueues', 'tab-all-cases'];
  
  tabIds.forEach(tabId => {
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
      if (tabId === activeTabId) {
        tabElement.classList.add('border-yellow-400', 'text-gray-900', 'font-semibold');
        tabElement.classList.remove('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
      } else {
        tabElement.classList.remove('border-yellow-400', 'text-gray-900', 'font-semibold');
        tabElement.classList.add('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
      }
    }
  });
}

function loadAllCases() {
  fetch(`${API_BASE}/cases?t=${new Date().getTime()}`, {
    headers: {
      'x-user-id': localStorage.getItem('userId')
    }
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      allCasesData = data;
      renderAllCases(data);
      // Reset to first page when loading new data
      currentPage.allCases = 1;
    })
    .catch(() => alert("There was an error while calling the API."));
}

function loadMyAssignments() {
  fetch(`${API_BASE}/assignments?t=${new Date().getTime()}`, {
    headers: {
      'x-user-id': localStorage.getItem('userId')
    }
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      myAssignmentsData = data;
      renderMyAssignments(data);
      // Reset to first page when loading new data
      currentPage.myWork = 1;
    })
    .catch(() => alert("There was an error while calling the API."));
}

function loadMyWorkQueues() {
  fetch(`${API_BASE}/operators/operator?t=${new Date().getTime()}`, {
    headers: {
      'x-user-id': localStorage.getItem('userId')
    }
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      if (!data || !data.workQueues || !data.workQueues.length) {
        const tabContent = document.getElementById('tab-content');
        tabContent.innerHTML = `
          <div class="bg-white p-6 shadow-md rounded-lg text-center">
            <p class="text-gray-500">No work queues available.</p>
          </div>
        `;
        return;
      }
      
      // Render dropdown with work queues
      const tabContent = document.getElementById('tab-content');
      tabContent.innerHTML = `
        <div class="mb-6">
          <label for="workqueue-select" class="block text-sm font-medium text-gray-700 mb-2">Select Work Queue</label>
          <select id="workqueue-select" class="border border-gray-300 rounded-md px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
            ${data.workQueues.map((queue, index) => `
              <option value="${queue}" ${index === 0 ? 'selected' : ''}>${queue}</option>
            `).join('')}
          </select>
        </div>
        <div id="workqueue-assignments-container"></div>
      `;
      
      // Add event listener for dropdown change
      document.getElementById('workqueue-select').addEventListener('change', function() {
        loadWorkQueueAssignments(this.value);
      });
      
      // Load assignments for the first work queue by default
      if (data.workQueues.length > 0) {
        loadWorkQueueAssignments(data.workQueues[0]);
      }
    })
    .catch(() => alert("There was an error while calling the API."));
}

function loadWorkQueueAssignments(workQueue) {
  fetch(`${API_BASE}/assignments/workqueue/${workQueue}?t=${new Date().getTime()}`, {
    headers: {
      'x-user-id': localStorage.getItem('userId')
    }
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      myWorkQueuesData = data;
      renderWorkQueueAssignments(data);
      // Reset to first page when loading new data
      currentPage.myWorkQueues = 1;
    })
    .catch(() => alert("There was an error while calling the API."));
}

function renderWorkQueueAssignments(data) {
  const container = document.getElementById('workqueue-assignments-container');
  
  // Calculate pagination
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage.myWorkQueues - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageData = data.slice(startIndex, endIndex);
  
  container.innerHTML = `
    <div class="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200">
        <thead>
          <tr class="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th class="py-3 px-6 cursor-pointer hover:bg-gray-100" onclick="sortWorkQueueAssignments('caseId')">Case ID</th>
            <th class="py-3 px-6 cursor-pointer hover:bg-gray-100" onclick="sortWorkQueueAssignments('createdAt')">Created At</th>
            <th class="py-3 px-6 cursor-pointer hover:bg-gray-100" onclick="sortWorkQueueAssignments('status')">Status</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${currentPageData.length > 0 ? currentPageData.map(assignment => `
            <tr class="cursor-pointer hover:bg-gray-50 transition duration-150" onclick="loadCaseDetails('${assignment.caseId}')">
              <td class="py-4 px-6 font-medium text-gray-900">${assignment.caseId}</td>
              <td class="py-4 px-6 text-gray-500">${new Date(assignment.createdAt || '').toLocaleString()}</td>
              <td class="py-4 px-6"><span class="px-2 py-1 rounded-full text-xs font-medium ${getBadgeClass(assignment.status)}">${assignment.status}</span></td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="3" class="py-4 px-6 text-center text-gray-500">No assignments found in this work queue.</td>
            </tr>
          `}
        </tbody>
      </table>
      
      ${data.length > ITEMS_PER_PAGE ? renderPagination(totalPages, currentPage.myWorkQueues, 'myWorkQueues') : ''}
    </div>
  `;
}

function sortWorkQueueAssignments(column) {
  // Toggle direction if same column is clicked again
  if (sortConfig.column === column) {
    sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
  } else {
    sortConfig.column = column;
    sortConfig.direction = 'asc';
  }
  
  const sortedData = [...myWorkQueuesData].sort((a, b) => {
    let aVal = a[column] || '';
    let bVal = b[column] || '';
    
    // Special handling for date fields
    if (column === 'createdAt') {
      aVal = new Date(aVal).getTime() || 0;
      bVal = new Date(bVal).getTime() || 0;
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    // Regular string comparison
    const comparison = aVal.toString().localeCompare(bVal.toString());
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });
  
  // Reset to first page when sorting
  currentPage.myWorkQueues = 1;
  renderWorkQueueAssignments(sortedData);
}

function renderAllCases(data) {
  const tabContent = document.getElementById('tab-content');
  
  // Calculate pagination
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage.allCases - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageData = data.slice(startIndex, endIndex);
  
  tabContent.innerHTML = `
    <div class="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200">
        <thead>
          <tr class="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th class="py-3 px-6 cursor-pointer hover:bg-gray-100" onclick="sortTable('caseId')">Case ID</th>
            <th class="py-3 px-6 cursor-pointer hover:bg-gray-100" onclick="sortTable('caseTypeId')">Case Type ID</th>
            <th class="py-3 px-6 cursor-pointer hover:bg-gray-100" onclick="sortTable('status')">Status</th>
            <th class="py-3 px-6 cursor-pointer hover:bg-gray-100" onclick="sortTable('createdBy')">Created By</th>
            <th class="py-3 px-6 cursor-pointer hover:bg-gray-100" onclick="sortTable('updatedAt')">Updated At</th>
            <th class="py-3 px-6 cursor-pointer hover:bg-gray-100" onclick="sortTable('updatedBy')">Updated By</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${currentPageData.map(caseItem => `
            <tr class="cursor-pointer hover:bg-gray-50 transition duration-150" onclick="loadCaseDetails('${caseItem.caseId}')">
              <td class="py-4 px-6 font-medium text-gray-900">${caseItem.caseId}</td>
              <td class="py-4 px-6 text-gray-500">${caseItem.caseTypeId}</td>
              <td class="py-4 px-6"><span class="px-2 py-1 rounded-full text-xs font-medium ${getBadgeClass(caseItem.status)}">${caseItem.status}</span></td>
              <td class="py-4 px-6 text-gray-500">${caseItem.createdBy}</td>
              <td class="py-4 px-6 text-gray-500">${new Date(caseItem.updatedAt || '').toLocaleString()}</td>
              <td class="py-4 px-6 text-gray-500">${caseItem.updatedBy}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      ${data.length > ITEMS_PER_PAGE ? renderPagination(totalPages, currentPage.allCases, 'allCases') : ''}
    </div>
  `;
}

function renderMyAssignments(data) {
  const tabContent = document.getElementById('tab-content');
  
  // Calculate pagination
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage.myWork - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageData = data.slice(startIndex, endIndex);
  
  tabContent.innerHTML = `
    <div class="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200">
        <thead>
          <tr class="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th class="py-3 px-6 cursor-pointer hover:bg-gray-100" onclick="sortAssignments('caseId')">Case ID</th>
            <th class="py-3 px-6 cursor-pointer hover:bg-gray-100" onclick="sortAssignments('createdAt')">Created At</th>
            <th class="py-3 px-6 cursor-pointer hover:bg-gray-100" onclick="sortAssignments('status')">Status</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${currentPageData.map(assignment => `
            <tr class="cursor-pointer hover:bg-gray-50 transition duration-150" onclick="loadCaseDetails('${assignment.caseId}')">
              <td class="py-4 px-6 font-medium text-gray-900">${assignment.caseId}</td>
              <td class="py-4 px-6 text-gray-500">${new Date(assignment.createdAt || '').toLocaleString()}</td>
              <td class="py-4 px-6"><span class="px-2 py-1 rounded-full text-xs font-medium ${getBadgeClass(assignment.status)}">${assignment.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      ${data.length > ITEMS_PER_PAGE ? renderPagination(totalPages, currentPage.myWork, 'myWork') : ''}
    </div>
  `;
}

function renderMySessions(data) {
  const tabContent = document.getElementById('tab-content');
  
  // Calculate pagination
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage.mySessions - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageData = data.slice(startIndex, endIndex);
  
  tabContent.innerHTML = `
    <div class="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200">
        <thead>
          <tr class="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th class="py-3 px-6 cursor-pointer hover:bg-gray-100" onclick="sortSessions('caseId')">Case ID</th>
            <th class="py-3 px-6 cursor-pointer hover:bg-gray-100" onclick="sortSessions('createdAt')">Created At</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${currentPageData.length > 0 ? currentPageData.map(session => `
            <tr class="cursor-pointer hover:bg-gray-50 transition duration-150" onclick="loadCaseDetails('${session.caseId}')">
              <td class="py-4 px-6 font-medium text-gray-900">${session.caseId}</td>
              <td class="py-4 px-6 text-gray-500">${new Date(session.createdAt || '').toLocaleString()}</td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="2" class="py-4 px-6 text-center text-gray-500">No active sessions found.</td>
            </tr>
          `}
        </tbody>
      </table>
      
      ${data.length > ITEMS_PER_PAGE ? renderPagination(totalPages, currentPage.mySessions, 'mySessions') : ''}
    </div>
  `;
}

function getBadgeClass(status) {
  switch (status) {
    case 'Review': return 'bg-blue-100 text-blue-800';
    case 'InProgress': return 'cba-yellow text-gray-900';
    case 'Resolved': return 'bg-green-100 text-green-800';
    case 'Failed': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Track sorting state
let sortConfig = {
  column: '',
  direction: 'asc'
};

function sortTable(column) {
  // Toggle direction if same column is clicked again
  if (sortConfig.column === column) {
    sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
  } else {
    sortConfig.column = column;
    sortConfig.direction = 'asc';
  }
  
  const sortedData = [...allCasesData].sort((a, b) => {
    let aVal = a[column] || '';
    let bVal = b[column] || '';
    
    // Special handling for date fields
    if (column === 'updatedAt' || column === 'createdAt') {
      aVal = new Date(aVal).getTime() || 0;
      bVal = new Date(bVal).getTime() || 0;
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    // Regular string comparison
    const comparison = aVal.toString().localeCompare(bVal.toString());
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });
  
  // Reset to first page when sorting
  currentPage.allCases = 1;
  renderAllCases(sortedData);
}

function sortAssignments(column) {
  // Toggle direction if same column is clicked again
  if (sortConfig.column === column) {
    sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
  } else {
    sortConfig.column = column;
    sortConfig.direction = 'asc';
  }
  
  const sortedData = [...myAssignmentsData].sort((a, b) => {
    let aVal = a[column] || '';
    let bVal = b[column] || '';
    
    // Special handling for date fields
    if (column === 'createdAt') {
      aVal = new Date(aVal).getTime() || 0;
      bVal = new Date(bVal).getTime() || 0;
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    // Regular string comparison
    const comparison = aVal.toString().localeCompare(bVal.toString());
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });
  
  // Reset to first page when sorting
  currentPage.myWork = 1;
  renderMyAssignments(sortedData);
}

function sortSessions(column) {
  // Toggle direction if same column is clicked again
  if (sortConfig.column === column) {
    sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
  } else {
    sortConfig.column = column;
    sortConfig.direction = 'asc';
  }
  
  const sortedData = [...mySessionsData].sort((a, b) => {
    let aVal = a[column] || '';
    let bVal = b[column] || '';
    
    // Special handling for date fields
    if (column === 'createdAt') {
      aVal = new Date(aVal).getTime() || 0;
      bVal = new Date(bVal).getTime() || 0;
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    // Regular string comparison
    const comparison = aVal.toString().localeCompare(bVal.toString());
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });
  
  // Reset to first page when sorting
  currentPage.mySessions = 1;
  renderMySessions(sortedData);
}

// Function to render pagination controls
function renderPagination(totalPages, currentPageNum, tableType) {
  if (totalPages <= 1) return '';
  
  let paginationHTML = `
    <div class="px-5 py-5 bg-white border-t flex flex-col xs:flex-row items-center xs:justify-between">
      <div class="inline-flex mt-2 xs:mt-0">
  `;
  
  // Previous button
  paginationHTML += `
    <button
      onclick="changePage(${currentPageNum - 1}, '${tableType}')"
      class="${currentPageNum === 1 ? 'opacity-50 cursor-not-allowed' : ''} text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-l"
      ${currentPageNum === 1 ? 'disabled' : ''}>
      Prev
    </button>
  `;
  
  // Page numbers
  paginationHTML += `<div class="flex">`;
  
  // Determine which page numbers to show
  let startPage = Math.max(1, currentPageNum - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  // Adjust if we're near the end
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  
  // First page and ellipsis if needed
  if (startPage > 1) {
    paginationHTML += `
      <button onclick="changePage(1, '${tableType}')" class="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4">
        1
      </button>
      ${startPage > 2 ? '<span class="text-sm bg-gray-200 text-gray-800 font-semibold py-2 px-4">...</span>' : ''}
    `;
  }
  
  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
      <button
        onclick="changePage(${i}, '${tableType}')"
        class="text-sm ${currentPageNum === i ? 'bg-yellow-400 text-gray-900' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} font-semibold py-2 px-4">
        ${i}
      </button>
    `;
  }
  
  // Last page and ellipsis if needed
  if (endPage < totalPages) {
    paginationHTML += `
      ${endPage < totalPages - 1 ? '<span class="text-sm bg-gray-200 text-gray-800 font-semibold py-2 px-4">...</span>' : ''}
      <button onclick="changePage(${totalPages}, '${tableType}')" class="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4">
        ${totalPages}
      </button>
    `;
  }
  
  paginationHTML += `</div>`;
  
  // Next button
  paginationHTML += `
    <button
      onclick="changePage(${currentPageNum + 1}, '${tableType}')"
      class="${currentPageNum === totalPages ? 'opacity-50 cursor-not-allowed' : ''} text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-r"
      ${currentPageNum === totalPages ? 'disabled' : ''}>
      Next
    </button>
  `;
  
  paginationHTML += `
      </div>
      <span class="text-xs xs:text-sm text-gray-500 mt-2 xs:mt-0">
        Page ${currentPageNum} of ${totalPages}
      </span>
    </div>
  `;
  
  return paginationHTML;
}

// Function to change the current page
function changePage(pageNumber, tableType) {
  if (tableType === 'allCases') {
    // Ensure page number is within valid range
    if (pageNumber < 1 || pageNumber > Math.ceil(allCasesData.length / ITEMS_PER_PAGE)) {
      return;
    }
    currentPage.allCases = pageNumber;
    renderAllCases(allCasesData);
  } else if (tableType === 'myWork') {
    // Ensure page number is within valid range
    if (pageNumber < 1 || pageNumber > Math.ceil(myAssignmentsData.length / ITEMS_PER_PAGE)) {
      return;
    }
    currentPage.myWork = pageNumber;
    renderMyAssignments(myAssignmentsData);
  } else if (tableType === 'myWorkQueues') {
    // Ensure page number is within valid range
    if (pageNumber < 1 || pageNumber > Math.ceil(myWorkQueuesData.length / ITEMS_PER_PAGE)) {
      return;
    }
    currentPage.myWorkQueues = pageNumber;
    renderWorkQueueAssignments(myWorkQueuesData);
  } else if (tableType === 'mySessions') {
    // Ensure page number is within valid range
    if (pageNumber < 1 || pageNumber > Math.ceil(mySessionsData.length / ITEMS_PER_PAGE)) {
      return;
    }
    currentPage.mySessions = pageNumber;
    renderMySessions(mySessionsData);
  }
}

function openCreateCasePopup() {
  fetch(`${API_BASE}/cases/types`, {
    headers: {
      'x-user-id': localStorage.getItem('userId')
    }
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(types => {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50';
      overlay.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-xl w-96 max-w-md">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-gray-800">Create Case</h3>
            <button onclick="document.querySelector('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <select id="case-type-select" class="border border-gray-300 rounded-md px-3 py-2 w-full mb-6 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
            ${types.map(type => `<option value="${type}">${type}</option>`).join('')}
          </select>
          <button class="cba-yellow text-gray-900 px-5 py-2 rounded-md font-medium hover:bg-yellow-500 transition duration-200 w-full" onclick="createCase()">Create Case</button>
        </div>
      `;
      document.body.appendChild(overlay);
    })
    .catch(() => alert("There was an error while calling the API."));
}

function createCase() {
  const selectedType = document.getElementById('case-type-select').value;
  fetch(`${API_BASE}/cases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('userId')
    },
    body: JSON.stringify({ caseTypeId: selectedType, userId: localStorage.getItem('userId') }),
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      document.querySelector('.fixed').remove();
      if (data && data.caseId) {
        loadCaseDetails(data.caseId);
      } else {
        // Fallback to dashboard if no caseId is returned
        loadDashboard();
      }
    })
    .catch(() => alert("There was an error while calling the API."));
}

function loadCaseDetails(caseId) {
  fetch(`${API_BASE}/cases/${caseId}`, {
    headers: {
      'x-user-id': localStorage.getItem('userId')
    }
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(caseData => {
      if (!caseData) {
        mainContent.innerHTML = '<p>Case not found</p>';
        return;
      }

      const statusBadge = `<span class="px-3 py-1 rounded-full text-sm font-medium ${getBadgeClass(caseData.status)}">${caseData.status}</span>`;
      
      // Format dates for better readability
      const createdAtFormatted = new Date(caseData.createdAt).toLocaleString();
      const updatedAtFormatted = new Date(caseData.updatedAt).toLocaleString();

      mainContent.innerHTML = `
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">Case Details</h2>
          ${statusBadge}
        </div>
        
        <!-- Modern Card Layout -->
        <div class="bg-white shadow-lg rounded-lg border border-gray-200 p-6 mb-6">
          <!-- Case ID and Label Section -->
          <div class="mb-6 border-b border-gray-200 pb-4">
            <h3 class="text-lg font-semibold text-gray-700 mb-2">${caseData.label || 'Case'}</h3>
            <div class="flex items-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              <span class="font-mono text-sm">${caseData.caseId}</span>
            </div>
          </div>
          
          <!-- Timeline Section -->
          <div class="mb-6">
            <h4 class="text-sm uppercase tracking-wider text-gray-500 mb-3">Timeline</h4>
            
            <div class="flex items-start mb-3">
              <div class="bg-green-100 rounded-full p-1 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium">Created by ${caseData.createdBy}</p>
                <p class="text-xs text-gray-500">${createdAtFormatted}</p>
              </div>
            </div>
            
            <div class="flex items-start">
              <div class="bg-blue-100 rounded-full p-1 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium">Updated by ${caseData.updatedBy}</p>
                <p class="text-xs text-gray-500">${updatedAtFormatted}</p>
              </div>
            </div>
          </div>
          
          <!-- Actions Section -->
          <div class="flex flex-wrap gap-3">
            ${caseData.currentAssignmentId ? `
              <button class="cba-yellow text-gray-900 px-5 py-2 rounded-md font-medium hover:bg-yellow-500 transition duration-200 flex items-center" onclick="performAssignment('${caseData.currentAssignmentId}', '${caseId}')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                Perform Assignment
              </button>
            ` : ''}
            
            <button class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-md font-medium transition duration-200 flex items-center mr-1" onclick="openMetadataPopup(${JSON.stringify(caseData.metadata || {}).replace(/"/g, '&quot;')})">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Case Data &nbsp&nbsp&nbsp&nbsp
            </button>
            
            <button class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-md font-medium transition duration-200 flex items-center" onclick="openCaseHistoryPopup('${caseData.caseId}')">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Case History
            </button>
          </div>
        </div>
      `;
    })
    .catch(() => alert("There was an error while calling the API."));
}

function performAssignment(assignmentId, caseId, casedata = {}) {
  // Ensure casedata is an object
  if (typeof casedata !== 'object') {
    try {
      casedata = casedata ? JSON.parse(casedata) : {};
    } catch (e) {
      console.error('Error parsing metadata:', e);
      casedata = {};
    }
  }

  // First fetch the complete case data
  fetch(`${API_BASE}/cases/${caseId}`, {
    headers: {
      'x-user-id': localStorage.getItem('userId')
    }
  })
  .then(res => res.ok ? res.json() : Promise.resolve({}))
  .then(fullCaseData => {
    // Extract metadata for assignment processing
    const caseMetadata = fullCaseData.metadata || {};
    
    // Then fetch the assignment details
    fetch(`${API_BASE}/assignments/${assignmentId}`, {
    headers: {
      'x-user-id': localStorage.getItem('userId')
    }
  })
    .then(res => {
      if (!res.ok) {
        // Store the status code for later use in the catch block
        const statusCode = res.status;
        
        // For errors, get the error message from the response
        return res.json().then(errorData => {
          const error = new Error(errorData.error || "Error loading assignment");
          // Attach the status code to the error object
          error.statusCode = statusCode;
          throw error;
        });
      }
      return res.json();
    })
    .then(data => {
      const metadata = data.metadata || {};
      const inputsHTML = Object.entries(metadata).map(([key, { label, value, type, required }]) => `
        <div class="mb-5">
        <div class="flex justify-between mb-1">
          <label class="block font-medium text-gray-700">${label}</label>
        </div>
          <input name="${key}" value="${caseMetadata[key] || ''}" type=${type} required=${required} class="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Enter ${key}" />
        </div>
      `).join('');

      // Determine avatar background color based on assignedToType
      const avatarBgColor = data.assignedToType === "WorkQueue" ? "bg-blue-500" : "cba-yellow";
      const avatarTextColor = data.assignedToType === "WorkQueue" ? "text-white" : "text-gray-900";
      const assignedToInitial = data.assignedTo ? data.assignedTo.charAt(0).toUpperCase() : "?";

      // Create the main content
      let contentHTML = `
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center">
            <div class="relative mr-3">
              <div class="${avatarBgColor} ${avatarTextColor} w-8 h-8 rounded-full flex items-center justify-center font-medium cursor-help hover-trigger">
                ${assignedToInitial}
              </div>
              <div class="absolute left-0 mt-2 w-auto min-w-max px-3 py-2 bg-gray-800 text-white text-xs rounded-md shadow-lg z-10 tooltip">
                Assigned to: ${data.assignedTo || 'Unknown'} (${data.assignedToType || 'Unknown'})
              </div>
            </div>
            <h3 class="text-xl font-bold text-gray-800" title="Assignment ID: ${assignmentId}">${data.label}</h3>
          </div>
          <div class="flex items-center">
            <span class="px-2 py-1 rounded-full text-xs font-medium ${getBadgeClass(data.status)} mr-3">${data.status}</span>
            
            <!-- Actions Dropdown -->
            <div class="relative inline-block text-left">
              <div>
                <button type="button" id="actions-menu-button" aria-expanded="true" aria-haspopup="true"
                  class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md font-medium transition duration-200 flex items-center text-sm"
                  onclick="toggleActionsMenu()">
                  Actions
                  <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
              <div id="actions-menu" class="hidden origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10" role="menu" aria-orientation="vertical" aria-labelledby="actions-menu-button" tabindex="-1">
                <div class="py-1" role="none">
                  <a href="#" class="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" role="menuitem" tabindex="-1" onclick="openTransferAssignmentPopup('${assignmentId}', '${caseId}'); return false;">
                    Transfer Assignment
                  </a>
                  <a href="#" class="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" role="menuitem" tabindex="-1" onclick="openCaseHistoryPopup('${caseId}'); return false;">
                    Case history
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>`;
        
      // Add the case lifecycle component if caseType, processId, and assignmentKey are available
      if (data.caseType && data.processId && data.assignmentKey) {
        // Create a div for the lifecycle component
        const lifecycleDiv = document.createElement('div');
        lifecycleDiv.id = 'case-lifecycle';
        lifecycleDiv.className = 'mb-6';
        
        // Add the lifecycle component to the main content
        contentHTML += `<div id="case-lifecycle" class="mb-6"></div>`;
      }
      
      // Add the form for the assignment
      contentHTML += `
        <form onsubmit="submitAssignment(event, '${caseId}')" class="bg-white p-6 shadow-lg rounded-lg border border-gray-200">
          ${inputsHTML}
          <div class="flex justify-between mt-6">
            <div class="flex space-x-3">
              <button type="button" onclick="previousAssignment('${caseId}')" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-md font-medium transition duration-200">Previous</button>
              <button type="button" onclick="closeCase('${caseId}')" class="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-md font-medium transition duration-200">Close</button>
            </div>
            <div class="flex space-x-3">
              <button type="button" onclick="saveCase(event, '${caseId}')" class="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-md font-medium transition duration-200">Save</button>
              <button type="submit" class="cba-yellow text-gray-900 px-5 py-2 rounded-md font-medium hover:bg-yellow-500 transition duration-200">Next</button>
            </div>
          </div>
        </form>
      `;
      
      // Set the main content HTML
      mainContent.innerHTML = contentHTML;
      
      // If we have the necessary data, add the lifecycle component
      if (data.caseType && data.processId && data.assignmentKey) {
        const lifecycleElement = displayCaseLifecycle(data.caseType, data.processId, data.assignmentKey);
        document.getElementById('case-lifecycle').appendChild(lifecycleElement);
      }
      
      // Add the case details card below the form
      const caseDetailsCard = getCaseDetails(fullCaseData);
      caseDetailsCard.className += ' mt-6'; // Add margin top for spacing
      mainContent.appendChild(caseDetailsCard);
    })
    .catch(error => {
      // Check if the error is a 402 status code
      if (error.statusCode === 402) {
        // Show routing notification in blue shade
        const routingMessage = document.createElement('div');
        routingMessage.className = 'fixed bottom-4 right-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-md z-50';
        routingMessage.innerHTML = `
          <div class="flex">
            <div class="py-1">
              <svg class="h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="font-bold">Assignment Routed</p>
              <p class="text-sm">${error.message || "The assignment has been routed appropriately."}</p>
            </div>
          </div>
        `;
        document.body.appendChild(routingMessage);
        
        // Remove message after 3 seconds
        setTimeout(() => {
          routingMessage.remove();
        }, 3000);
      } else {
        // Show regular error message for other errors
        const errorMessage = document.createElement('div');
        errorMessage.className = 'fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md z-50';
        errorMessage.innerHTML = `
          <div class="flex">
            <div class="py-1">
              <svg class="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="font-bold">Error</p>
              <p class="text-sm">${error.message || "There was an error while loading the assignment."}</p>
            </div>
          </div>
        `;
        document.body.appendChild(errorMessage);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
          errorMessage.remove();
        }, 5000);
      }
      
      // Load case details on any error
      loadCaseDetails(caseId);
    });
  })
  .catch(error => {
    // This catch block handles errors from the fetchCaseData Promise
    // Check if the error is a 402 status code
    if (error.statusCode === 402) {
      // Show routing notification in blue shade
      const routingMessage = document.createElement('div');
      routingMessage.className = 'fixed bottom-4 right-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-md z-50';
      routingMessage.innerHTML = `
        <div class="flex">
          <div class="py-1">
            <svg class="h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Assignment Routed</p>
            <p class="text-sm">${error.message || "The assignment has been routed appropriately."}</p>
          </div>
        </div>
      `;
      document.body.appendChild(routingMessage);
      
      // Remove message after 3 seconds
      setTimeout(() => {
        routingMessage.remove();
      }, 3000);
    } else {
      // Show regular error message for other errors
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md z-50';
      errorMessage.innerHTML = `
        <div class="flex">
          <div class="py-1">
            <svg class="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Error</p>
            <p class="text-sm">${error.message || "There was an error while loading the assignment."}</p>
          </div>
        </div>
      `;
      document.body.appendChild(errorMessage);
      
      // Remove error message after 5 seconds
      setTimeout(() => {
        errorMessage.remove();
      }, 5000);
    }
    
    // Load case details on any error
    loadCaseDetails(caseId);
  });
}

function submitAssignment(event, caseId) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const metadata = {};
  formData.forEach((value, key) => {
    metadata[key] = value;
  });

  fetch(`${API_BASE}/cases/${caseId}/next`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('userId')
    },
    body: JSON.stringify(metadata),
  })
    .then(res => {
      if (!res.ok) {
        // Store the status code for later use in the catch block
        const statusCode = res.status;
        
        // For errors, get the error message from the response
        return res.json().then(errorData => {
          const error = new Error(errorData.error || "Error processing assignment");
          // Attach the status code to the error object
          error.statusCode = statusCode;
          throw error;
        });
      }
      return res.json();
    })
    .catch(error => {
      // Check if the error is a 402 status code
      if (error.statusCode === 402) {
        // Show routing notification in blue shade
        const routingMessage = document.createElement('div');
        routingMessage.className = 'fixed bottom-4 right-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-md z-50';
        routingMessage.innerHTML = `
          <div class="flex">
            <div class="py-1">
              <svg class="h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="font-bold">Assignment Routed</p>
              <p class="text-sm">${error.message || "The assignment has been routed appropriately."}</p>
            </div>
          </div>
        `;
        document.body.appendChild(routingMessage);
        
        // Remove message after 3 seconds
        setTimeout(() => {
          routingMessage.remove();
        }, 3000);
      } else {
        // Show regular error message for other errors
        const errorMessage = document.createElement('div');
        errorMessage.className = 'fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md z-50';
        errorMessage.innerHTML = `
          <div class="flex">
            <div class="py-1">
              <svg class="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="font-bold">Error</p>
              <p class="text-sm">${error.message || "There was an error while processing the assignment."}</p>
            </div>
          </div>
        `;
        document.body.appendChild(errorMessage);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
          errorMessage.remove();
        }, 5000);
      }
      
      // Load case details instead of dashboard for any error
      loadCaseDetails(caseId);
      
      // Prevent further promise chain execution
      return Promise.reject(error);
    })
    .then(resp => {
      if (resp.currentAssignmentId) {
        performAssignment(resp.currentAssignmentId, caseId, resp.metadata);
      } else {
        mainContent.innerHTML = `
          <div class="bg-green-50 text-green-800 p-8 rounded-lg shadow-lg text-center border border-green-200 mt-10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 class="text-2xl font-bold mb-2">Case Completed Successfully</h2>
            <p class="text-green-600">All steps have been processed and finalized</p>
          </div>
        `;
      }
    });
}

function saveCase(event, caseId) {
  event.preventDefault();
  
  // Get form data
  const form = event.target.closest('form');
  const formData = new FormData(form);
  const metadata = {};
  formData.forEach((value, key) => {
    metadata[key] = value;
  });

  // Make API call
  fetch(`${API_BASE}/cases/${caseId}/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('userId')
    },
    body: JSON.stringify(metadata),
  })
    .then(res => {
      if (!res.ok) {
        return res.json().then(errorData => {
          throw new Error(errorData.error || "Error saving case details");
        });
      }
      return res.json();
    })
    .then(() => {
      // Show success notification
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50';
      successMessage.innerHTML = `
        <div class="flex">
          <div class="py-1">
            <svg class="h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Success!</p>
            <p class="text-sm">Case details have been saved successfully.</p>
          </div>
        </div>
      `;
      document.body.appendChild(successMessage);
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
    })
    .catch(error => {
      // Show error notification
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md z-50';
      errorMessage.innerHTML = `
        <div class="flex">
          <div class="py-1">
            <svg class="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Error</p>
            <p class="text-sm">${error.message || "There was an error while saving the case details."}</p>
          </div>
        </div>
      `;
      document.body.appendChild(errorMessage);
      
      // Remove error message after 5 seconds
      setTimeout(() => {
        errorMessage.remove();
      }, 5000);
    });
}

function previousAssignment(caseId) {
  fetch(`${API_BASE}/cases/${caseId}/previous`, {
    method: 'POST',
    headers: {
      'x-user-id': localStorage.getItem('userId')
    }
  })
    .then(res => {
      if (!res.ok) {
        // Store the status code for later use in the catch block
        const statusCode = res.status;
        
        // For errors, get the error message from the response
        return res.json().then(errorData => {
          const error = new Error(errorData.error || "Error navigating to previous assignment");
          // Attach the status code to the error object
          error.statusCode = statusCode;
          throw error;
        });
      }
      return res.json();
    })
    .catch(error => {
      // Check if the error is a 402 status code
      if (error.statusCode === 402) {
        // Show routing notification in blue shade
        const routingMessage = document.createElement('div');
        routingMessage.className = 'fixed bottom-4 right-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-md z-50';
        routingMessage.innerHTML = `
          <div class="flex">
            <div class="py-1">
              <svg class="h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="font-bold">Assignment Routed</p>
              <p class="text-sm">${error.message || "The assignment has been routed appropriately."}</p>
            </div>
          </div>
        `;
        document.body.appendChild(routingMessage);
        
        // Remove message after 3 seconds
        setTimeout(() => {
          routingMessage.remove();
        }, 3000);
      } else {
        // Show regular error message for other errors
        const errorMessage = document.createElement('div');
        errorMessage.className = 'fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md z-50';
        errorMessage.innerHTML = `
          <div class="flex">
            <div class="py-1">
              <svg class="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="font-bold">Error</p>
              <p class="text-sm">${error.message || "There was an error while navigating to the previous assignment."}</p>
            </div>
          </div>
        `;
        document.body.appendChild(errorMessage);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
          errorMessage.remove();
        }, 5000);
      }
      
      // Load case details instead of dashboard for any error
      loadCaseDetails(caseId);
      
      // Prevent further promise chain execution
      return Promise.reject(error);
    })
    .then(resp => {
      if (resp.currentAssignmentId) {
        performAssignment(resp.currentAssignmentId, caseId, resp.metadata);
      } else {
        mainContent.innerHTML = `
          <div class="text-center p-8 mt-10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="text-xl font-medium text-gray-600">No previous assignment found</div>
          </div>`;
      }
    });
}

function openTransferAssignmentPopup(assignmentId, caseId) {
  // Create the initial popup with transfer type selection
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50';
  overlay.innerHTML = `
    <div class="bg-white p-8 rounded-lg shadow-xl w-96 max-w-md">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-gray-800">Transfer Assignment</h3>
        <button onclick="document.querySelector('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="mb-6">
        <label class="block font-medium text-gray-700 mb-2">Select Transfer Type</label>
        <select id="transfer-type-select" class="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
          <option value="" selected disabled>Select Transfer Type</option>
          <option value="Operator">Operator</option>
          <option value="WorkQueue">Work Queue</option>
        </select>
      </div>
      <div id="transfer-target-container" class="mb-6 hidden">
        <label id="transfer-target-label" class="block font-medium text-gray-700 mb-2">Select Target</label>
        <select id="transfer-target-select" class="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
          <!-- Options will be populated dynamically -->
        </select>
      </div>
      <button id="transfer-button" class="cba-yellow text-gray-900 px-5 py-2 rounded-md font-medium hover:bg-yellow-500 transition duration-200 w-full opacity-50 cursor-not-allowed" disabled onclick="transferAssignment('${assignmentId}', '${caseId}')">Transfer Assignment</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // Add event listener for transfer type selection
  document.getElementById('transfer-type-select').addEventListener('change', function() {
    const transferType = this.value;
    const targetContainer = document.getElementById('transfer-target-container');
    const targetLabel = document.getElementById('transfer-target-label');
    const targetSelect = document.getElementById('transfer-target-select');
    const transferButton = document.getElementById('transfer-button');
    
    // Clear previous options
    targetSelect.innerHTML = '';
    
    // Show the target selection container
    targetContainer.classList.remove('hidden');
    
    // Update label based on selection
    if (transferType === 'Operator') {
      targetLabel.textContent = 'Select Operator';
      
      // Fetch operators
      fetch(`${API_BASE}/operators`, {
        headers: {
          'x-user-id': localStorage.getItem('userId')
        }
      })
        .then(res => {
          if (!res.ok) {
            return res.json().then(errorData => {
              throw new Error(errorData.error || "Error fetching operators");
            });
          }
          return res.json();
        })
        .then(users => {
          // Populate the select with operators
          users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.OperatorID;
            option.textContent = user.UserName;
            targetSelect.appendChild(option);
          });
          
          // Enable the transfer button
          transferButton.classList.remove('opacity-50', 'cursor-not-allowed');
          transferButton.disabled = false;
        })
        .catch(error => showErrorNotification(error.message || "There was an error while fetching operators."));
    } else if (transferType === 'WorkQueue') {
      targetLabel.textContent = 'Select Work Queue';
      
      // Fetch work queues
      fetch(`${API_BASE}/operators/workqueues`, {
        headers: {
          'x-user-id': localStorage.getItem('userId')
        }
      })
        .then(res => {
          if (!res.ok) {
            return res.json().then(errorData => {
              throw new Error(errorData.error || "Error fetching work queues");
            });
          }
          return res.json();
        })
        .then(workQueues => {
          // Populate the select with work queues
          workQueues.forEach(queue => {
            const option = document.createElement('option');
            option.value = queue.key;
            option.textContent = queue.label;
            targetSelect.appendChild(option);
          });
          
          // Enable the transfer button
          transferButton.classList.remove('opacity-50', 'cursor-not-allowed');
          transferButton.disabled = false;
        })
        .catch(error => showErrorNotification(error.message || "There was an error while fetching work queues."));
    }
  });
}

// Helper function to show error notifications
function showErrorNotification(message) {
  const errorMessage = document.createElement('div');
  errorMessage.className = 'fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md z-50';
  errorMessage.innerHTML = `
    <div class="flex">
      <div class="py-1">
        <svg class="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p class="font-bold">Error</p>
        <p class="text-sm">${message}</p>
      </div>
    </div>
  `;
  document.body.appendChild(errorMessage);
  
  // Remove error message after 5 seconds
  setTimeout(() => {
    errorMessage.remove();
  }, 5000);
}

function transferAssignment(assignmentId, caseId) {
  const transferType = document.getElementById('transfer-type-select').value;
  const selectedTarget = document.getElementById('transfer-target-select').value;
  
  fetch(`${API_BASE}/assignments/${assignmentId}/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('userId')
    },
    body: JSON.stringify({
      operatorId: selectedTarget,
      routeToType: transferType
    }),
  })
    .then(res => {
      if (!res.ok) {
        // For 400 errors, get the error message from the response
        return res.json().then(errorData => {
          throw new Error(errorData.error || "Error transferring assignment");
        });
      }
      return res.json();
    })
    .then(() => {
      document.querySelector('.fixed').remove();
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50';
      successMessage.innerHTML = `
        <div class="flex">
          <div class="py-1">
            <svg class="h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Success!</p>
            <p class="text-sm">Assignment successfully transferred to ${transferType === 'Operator' ? 'operator' : 'work queue'}.</p>
          </div>
        </div>
      `;
      document.body.appendChild(successMessage);
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
      
      // Go back to dashboard
      loadDashboard();
    })
    .catch(error => {
      // Show error message in a similar style to success message, but in red
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md z-50';
      errorMessage.innerHTML = `
        <div class="flex">
          <div class="py-1">
            <svg class="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Error</p>
            <p class="text-sm">${error.message || "There was an error while transferring the assignment."}</p>
          </div>
        </div>
      `;
      document.body.appendChild(errorMessage);
      
      // Remove error message after 5 seconds
      setTimeout(() => {
        errorMessage.remove();
      }, 5000);
    });
}

function openMetadataPopup(metadata) {
  // Create metadata table rows
  let metadataHTML = '';
  
  if (Object.keys(metadata).length === 0) {
    metadataHTML = '<tr><td colspan="2" class="py-4 text-center text-gray-500">No metadata available</td></tr>';
  } else {
    metadataHTML = Object.entries(metadata).map(([key, value]) => {
      const formattedValue = typeof value === 'object' ? JSON.stringify(value) : value;
      return `
        <tr class="border-b">
          <td class="py-2 px-4 font-semibold bg-gray-50">${key}</td>
          <td class="py-2 px-4">${formattedValue}</td>
        </tr>
      `;
    }).join('');
  }

  // Create and append the popup
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50';
  overlay.innerHTML = `
    <div class="bg-white p-8 rounded-lg shadow-xl w-3/4 max-w-2xl max-h-3/4 overflow-auto">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-gray-800">Case data</h3>
        <button onclick="document.querySelector('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="bg-white rounded-lg overflow-hidden">
        <table class="w-full">
          <tbody class="divide-y divide-gray-200">
            ${metadataHTML}
          </tbody>
        </table>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function toggleActionsMenu() {
  const menu = document.getElementById('actions-menu');
  menu.classList.toggle('hidden');
  
  // Close the menu when clicking outside
  document.addEventListener('click', function closeMenu(e) {
    const actionsButton = document.getElementById('actions-menu-button');
    const actionsMenu = document.getElementById('actions-menu');
    
    if (e.target !== actionsButton && !actionsButton.contains(e.target) &&
        e.target !== actionsMenu && !actionsMenu.contains(e.target)) {
      actionsMenu.classList.add('hidden');
      document.removeEventListener('click', closeMenu);
    }
  }, { once: true });
}

function openCaseHistoryPopup(caseId) {
  // Fetch case history data
  fetch(`${API_BASE}/history/${caseId}`, {
    headers: {
      'x-user-id': localStorage.getItem('userId')
    }
  })
    .then(res => {
      if (!res.ok) {
        // For errors, get the error message from the response
        return res.json().then(errorData => {
          throw new Error(errorData.error || "Error fetching case history");
        });
      }
      return res.json();
    })
    .then(historyData => {
      // Create and append the popup
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50';
      
      // Format the history data into table rows
      const historyRows = historyData.map(item => `
        <tr class="border-b hover:bg-gray-50">
          <td class="py-3 px-4">${new Date(item.createdAt).toLocaleString()}</td>
          <td class="py-3 px-4">${item.description}</td>
          <td class="py-3 px-4">${item.createdBy}</td>
        </tr>
      `).join('');
      
      overlay.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-xl w-3/4 max-w-4xl max-h-3/4 overflow-auto">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-gray-800">Case History</h3>
            <button onclick="document.querySelector('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="bg-white rounded-lg overflow-hidden border border-gray-200">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr class="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th class="py-3 px-4">Created At</th>
                  <th class="py-3 px-4">Description</th>
                  <th class="py-3 px-4">Created By</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${historyRows.length > 0 ? historyRows : '<tr><td colspan="3" class="py-4 text-center text-gray-500">No history available</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    })
    .catch(error => {
      // Show error message in a styled notification
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md z-50';
      errorMessage.innerHTML = `
        <div class="flex">
          <div class="py-1">
            <svg class="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Error</p>
            <p class="text-sm">${error.message || "There was an error while fetching case history."}</p>
          </div>
        </div>
      `;
      document.body.appendChild(errorMessage);
      
      // Remove error message after 5 seconds
      setTimeout(() => {
        errorMessage.remove();
      }, 5000);
    });
}

function closeCase(caseId) {
  // Call the API endpoint to close the case
  fetch(`${API_BASE}/cases/close`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('userId')
    },
    body: JSON.stringify({ caseId }),
  })
    .then(res => {
      if (!res.ok) {
        // For errors, get the error message from the response
        return res.json().then(errorData => {
          throw new Error(errorData.error || "Error closing case");
        });
      }
      return res.json();
    })
    .then(() => {
      // Show success notification
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50';
      successMessage.innerHTML = `
        <div class="flex">
          <div class="py-1">
            <svg class="h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Success!</p>
            <p class="text-sm">Case has been closed successfully.</p>
          </div>
        </div>
      `;
      document.body.appendChild(successMessage);
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
      
      // Load case details screen
      loadCaseDetails(caseId);
    })
    .catch(error => {
      // Show error notification
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md z-50';
      errorMessage.innerHTML = `
        <div class="flex">
          <div class="py-1">
            <svg class="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Error</p>
            <p class="text-sm">${error.message || "There was an error while closing the case."}</p>
          </div>
        </div>
      `;
      document.body.appendChild(errorMessage);
      
      // Remove error message after 5 seconds
      setTimeout(() => {
        errorMessage.remove();
      }, 5000);
    });
}

// Function to create a new case type
function createNewCaseType() {
  // Hide the case types container
  document.getElementById('case-types-container').classList.add('hidden');
  
  // Show the schema details container
  const schemaContainer = document.getElementById('schema-details-container');
  schemaContainer.classList.remove('hidden');
  
  // Create initial schema template
  const initialSchema = {
    "id": "",
    "rpl": "",
    "resolvedStatus": "Resolved",
    "label": "",
    "processes": {
      "process1": {
        "status": "InProgress",
        "condition": "",
        "assignments": [
          "A1"
        ],
        "assignmentConfigs": {
          "A1": {
            "label": "",
            "routeToType": "Operator",
            "routeTo": "current",
            "condition": "",
            "properties": []
          }
        }
      }
    }
  };
  
  // Store the schema in the global variable
  window.originalSchema = initialSchema;
  window.currentEditMode = true;
  
  // Render the schema in edit mode
  renderCaseTypeSchema(initialSchema, "new");
  
  // Force edit mode to be active
  const viewElements = document.querySelectorAll('.view-mode');
  const editElements = document.querySelectorAll('.edit-mode');
  
  viewElements.forEach(el => {
    el.classList.add('hidden');
  });
  
  editElements.forEach(el => {
    el.classList.remove('hidden');
  });
  
  // Modify the save button to create a new case type instead of updating
  const saveButton = document.querySelector('#edit-actions button');
  if (saveButton) {
    saveButton.onclick = function() { saveNewCaseType(); };
  }
}

// Function to save a new case type
function saveNewCaseType() {
  // Similar to saveSchemaChanges but for creating a new case type
  const updatedSchema = JSON.parse(JSON.stringify(window.originalSchema));
  
  // Update the top-level properties
  updatedSchema.label = document.querySelector('#schema-label-edit input').value;
  updatedSchema.resolvedStatus = document.querySelector('#status-badge-edit select').value;
  updatedSchema.rpl = document.querySelector('#schema-id-edit input').value;
  
  // Set the id field to be the same as rpl
  updatedSchema.id = updatedSchema.rpl;
  
  // Create a new processes object to store the updated processes
  const updatedProcesses = {};
  
  // Collect process data - only from processes that still exist in the DOM
  const processElements = document.querySelectorAll('[id^="process-"]');
  processElements.forEach(processEl => {
    const processKey = processEl.querySelector('input[data-original-key]').value;
    const originalKey = processEl.querySelector('input[data-original-key]').getAttribute('data-original-key');
    
    // Create the process object
    updatedProcesses[processKey] = {
      status: processEl.querySelector('select').value,
      condition: processEl.querySelector('input[placeholder="Enter condition expression"]').value,
      assignments: [],
      assignmentConfigs: {}
    };
    
    // Collect assignment data - only from assignments that still exist in the DOM
    const assignmentsContainer = document.getElementById(`assignments-${originalKey}`);
    const assignmentElements = assignmentsContainer.querySelectorAll('[id^="assignment-"]');
    
    assignmentElements.forEach(assignmentEl => {
      const assignmentId = assignmentEl.id.replace('assignment-', '');
      updatedProcesses[processKey].assignments.push(assignmentId);
      
      const inputs = assignmentEl.querySelectorAll('input, select');
      const label = inputs[0].value;
      const routeToType = inputs[1].value;
      const routeTo = inputs[2].value;
      
      // Get the condition value from the assignment
      const conditionInput = assignmentEl.querySelector('input[placeholder="Enter condition expression"]');
      const condition = conditionInput ? conditionInput.value : "";
      
      updatedProcesses[processKey].assignmentConfigs[assignmentId] = {
        label,
        routeToType,
        routeTo,
        condition,
        properties: []
      };
      
      // Collect property data - only from properties that still exist in the DOM
      const propertiesContainer = document.getElementById(`properties-${assignmentId}`);
      const propertyElements = propertiesContainer.querySelectorAll('.property-item');
      
      propertyElements.forEach(propEl => {
        const propInputs = propEl.querySelectorAll('input, select');
        if (propInputs.length >= 5) {
          const property = {
            label: propInputs[0].value,
            key: propInputs[1].value,
            type: propInputs[2].value,
            value: propInputs[3].value || undefined,
            required: propInputs[4].value === 'true'
          };
          
          updatedProcesses[processKey].assignmentConfigs[assignmentId].properties.push(property);
        }
      });
    });
  });
  
  // Replace the processes object with our updated version
  updatedSchema.processes = updatedProcesses;
  
  // Validate required fields
  if (!updatedSchema.rpl) {
    showErrorNotification("Case Type ID (RPL) is required");
    return;
  }
  
  if (!updatedSchema.label) {
    showErrorNotification("Case Type Label is required");
    return;
  }
  
  // Send the new schema to the server
  fetch(`${API_BASE}/cases/types`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('userId')
    },
    body: JSON.stringify(updatedSchema)
  })
    .then(res => {
      if (!res.ok) {
        throw new Error('Failed to create new case type');
      }
      return res.json();
    })
    .then(data => {
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50';
      successMessage.innerHTML = `
        <div class="flex">
          <div class="py-1">
            <svg class="h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Success!</p>
            <p class="text-sm">New case type has been created successfully.</p>
          </div>
        </div>
      `;
      document.body.appendChild(successMessage);
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
      
      // Reload the case types list
      loadCaseTypes();
    })
    .catch(error => {
      // Show error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md z-50';
      errorMessage.innerHTML = `
        <div class="flex">
          <div class="py-1">
            <svg class="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Error</p>
            <p class="text-sm">${error.message || "There was an error while creating the case type."}</p>
          </div>
        </div>
      `;
      document.body.appendChild(errorMessage);
      
      // Remove error message after 5 seconds
      setTimeout(() => {
        errorMessage.remove();
      }, 5000);
    });
}

function signOut() {
  localStorage.removeItem('userId');
  localStorage.removeItem('role');
  location.reload();
}

/**
 * Displays the lifecycle of a case based on its type, current process, and current assignment
 * @param {string} caseTypeID - The ID of the case type
 * @param {string} currentProcess - The current process ID
 * @param {string} currentAssignment - The current assignment ID
 * @returns {HTMLElement} - A div containing the lifecycle visualization or empty div if API call fails
 */
function displayCaseLifecycle(caseTypeID, currentProcess, currentAssignment) {
  // Create a container div for the lifecycle
  const lifecycleContainer = document.createElement('div');
  lifecycleContainer.className = 'case-lifecycle-container mt-2 mb-4 w-full';
  
  // Make API call to get the case type schema
  fetch(`${API_BASE}/cases/types/${caseTypeID}`, {
    headers: {
      'x-user-id': localStorage.getItem('userId')
    }
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to fetch case type schema');
    return res.json();
  })
  .then(schema => {
    // Get all processes from the schema
    const processes = Object.entries(schema.processes);
    
    // Create a simple horizontal lifecycle visualization with all assignments
    let html = `
      <div class="bg-white p-3 rounded-lg shadow-md border border-gray-200 w-full">
        <div class="flex justify-center items-center w-full">
          <div class="flex items-center overflow-x-auto py-2 min-w-0 w-full justify-center">
    `;
    
    // Process each process and its assignments
    processes.forEach(([processKey, process], processIndex) => {
      // Check if this is the current process
      const isCurrentProcess = processKey === currentProcess;
      
      // Process each assignment in this process
      process.assignments.forEach((assignmentId, assignmentIndex) => {
        const assignmentConfig = process.assignmentConfigs[assignmentId];
        if (!assignmentConfig) return;
        
        // Check if this is the current assignment
        const isCurrentAssignment = assignmentId === currentAssignment && isCurrentProcess;
        
        html += `
          <div class="flex items-center flex-shrink-0">
            <!-- Assignment box -->
            <div class="flex items-center px-4 py-2 rounded-md ${isCurrentAssignment ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50 border border-gray-200'}">
              <div class="w-2 h-2 rounded-full ${isCurrentAssignment ? 'bg-blue-500' : 'bg-gray-400'} mr-2"></div>
              <div class="text-sm ${isCurrentAssignment ? 'text-blue-600 font-medium' : 'text-gray-600'} whitespace-nowrap">
                ${assignmentConfig.label || assignmentId}
              </div>
            </div>
            
            <!-- Arrow between assignments -->
            ${!(processIndex === processes.length - 1 && assignmentIndex === process.assignments.length - 1) ? `
              <div class="mx-3 text-gray-400 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ` : ''}
          </div>
        `;
      });
      
      // Add a different style arrow between processes
      if (processIndex < processes.length - 1) {
        html += `
          <div class="mx-4 text-blue-500 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </div>
        `;
      }
    });
    
    html += `
          </div>
        </div>
      </div>
    `;
    
    // Set the HTML content
    lifecycleContainer.innerHTML = html;
  })
  .catch(error => {
    console.error('Error fetching case type schema:', error);
    // Return an empty div if API call fails
    lifecycleContainer.innerHTML = '';
  });
  
  return lifecycleContainer;
}

/**
 * Creates a card to display case details in read-only format
 * @param {Object} caseDetails - The case details object containing metadata, timestamps and user info
 * @returns {HTMLElement} - A div element with card styling displaying case information
 */
function getCaseDetails(caseDetails) {
  // Format dates for better readability
  const createdAtFormatted = new Date(caseDetails.createdAt).toLocaleString();
  const updatedAtFormatted = new Date(caseDetails.updatedAt).toLocaleString();
  
  // Create the main card container
  const cardContainer = document.createElement('div');
  cardContainer.className = 'bg-white shadow-lg rounded-lg border border-gray-200 p-6';
  
  // Create the header section with case info
  const headerSection = document.createElement('div');
  headerSection.className = 'mb-4 border-b border-gray-200 pb-4';
  headerSection.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <h3 class="text-lg font-semibold text-gray-700">${caseDetails.label || 'Case Details'}</h3>
    </div>
    <p class="text-sm text-gray-500">ID: ${caseDetails.caseId}</p>
  `;
  
  // Create the user info section
  const userInfoSection = document.createElement('div');
  userInfoSection.className = 'mb-4 grid grid-cols-2 gap-4';
  userInfoSection.innerHTML = `
    <div>
      <p class="text-xs text-gray-500">Created By</p>
      <p class="text-sm font-medium">${caseDetails.createdBy}</p>
      <p class="text-xs text-gray-400">${createdAtFormatted}</p>
    </div>
    <div>
      <p class="text-xs text-gray-500">Updated By</p>
      <p class="text-sm font-medium">${caseDetails.updatedBy}</p>
      <p class="text-xs text-gray-400">${updatedAtFormatted}</p>
    </div>
  `;
  
  // Create the metadata section
  const metadataSection = document.createElement('div');
  metadataSection.className = 'mt-4';
  
  // Add metadata header
  const metadataHeader = document.createElement('h4');
  metadataHeader.className = 'text-sm uppercase tracking-wider text-gray-500 mb-2';
  metadataHeader.textContent = 'Metadata';
  metadataSection.appendChild(metadataHeader);
  
  // Create metadata content
  const metadataContent = document.createElement('div');
  metadataContent.className = 'bg-gray-50 rounded-lg p-4 border border-gray-200';
  
  // Check if metadata exists and has properties
  if (caseDetails.metadata && Object.keys(caseDetails.metadata).length > 0) {
    // Create a table to display metadata
    const metadataTable = document.createElement('table');
    metadataTable.className = 'min-w-full divide-y divide-gray-200';
    
    // Create table body
    const tableBody = document.createElement('tbody');
    tableBody.className = 'divide-y divide-gray-200';
    
    // Add rows for each metadata field
    Object.entries(caseDetails.metadata).forEach(([key, value]) => {
      // Format the value based on its type
      let displayValue = value;
      if (typeof value === 'object' && value !== null) {
        displayValue = JSON.stringify(value);
      }
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="py-2 px-4 text-sm font-medium text-gray-900">${key}</td>
        <td class="py-2 px-4 text-sm text-gray-500">${displayValue}</td>
      `;
      tableBody.appendChild(row);
    });
    
    metadataTable.appendChild(tableBody);
    metadataContent.appendChild(metadataTable);
  } else {
    // Display a message if no metadata is available
    metadataContent.innerHTML = '<p class="text-sm text-gray-500 text-center">No metadata available</p>';
  }
  
  metadataSection.appendChild(metadataContent);
  
  // Assemble the card
  cardContainer.appendChild(headerSection);
  cardContainer.appendChild(userInfoSection);
  cardContainer.appendChild(metadataSection);
  
  return cardContainer;
}
