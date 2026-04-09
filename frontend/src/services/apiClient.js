import axios from "axios";
import authService from "./authService";
const baseURL = import.meta.env.VITE_API_BASE_URL;
const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});
// 1st INTERCEPTOR, Attach token to every outgoing request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2nd INTERCEPTOR,  Handle 401 errors (The Refresh Logic)
let isRefresh=false;//This Prevents duplicate refresh calls to the backend, acts like a lock
let failedQueue=[]//Holds requests in queue while a refresh is happening.
//process the queue here, to wake up all pending requests once the refresh finishes.
const processQueue=(error, token=null)=>{
  failedQueue.forEach(promise=>{
if(error){
   promise.reject(error)//refresh failed, kill the queue
    } else {
   promise.resolve(token)// refresh succeded, give out the new issued access token
    }
  }
  )
failedQueue=[];
}
apiClient.interceptors.response.use(
  (response) => response, 
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
//check if localstorage is already updated with new token, before proceeding to the nextstep
      const latestToken = localStorage.getItem('accessToken');
      if (latestToken && `Bearer ${latestToken}` !== originalRequest.headers['Authorization']) {
        originalRequest._retry = true;
        originalRequest.headers['Authorization'] = `Bearer ${latestToken}`;
        return apiClient(originalRequest); // Immediately exit from refresh process and use this new token
      }
      originalRequest._retry = true;//mark as retrying to prevent infinte loops.
      //1st scenario, this will be the waititng room
      //a refresh is already happening
     if(isRefresh){
      return new Promise((resolve, reject)=>{
      const currentToken = localStorage.getItem('accessToken');
  /* a last second checkjust in case the refresh is finished exactly as the current requests enter this block...
   If the token in storage is already different from our failed header,
   someone else just finished a refresh. Don't join the queue. */
  if (currentToken && `Bearer ${currentToken}` !== originalRequest.headers['Authorization']) {
    originalRequest.headers['Authorization'] = `Bearer ${currentToken}`;
    return resolve(apiClient(originalRequest)); // Exit the queue immediately
  }
failedQueue.push({resolve, reject}); // actually join the queue and wait for processQueue to call resolve/rejec.
      }).then(token=>{
        //processQueue will wake up these so they will retry with new token.
        originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return apiClient(originalRequest); 
      }).catch(err=>Promise.reject(err))
     }
     isRefresh=true;// lock this block so following requests can go to the the queue
     //2nd scenario, the first request to hit the 401, call this the leader
     return new Promise((resolve,reject)=>{
      authService.refreshToken()
      //attach 'then' to this backend call to get the new token
      .then((newToken)=>{
       localStorage.setItem('accessToken', newToken); 
    // release the queue before resolving the leader so no request will stay stuck.
    processQueue(null, newToken);
    // Retry the original leader request
         originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
         resolve(apiClient(originalRequest));
      }).catch((err)=>{
        //refresh failed, kill the queue
        processQueue(err,null);
        reject(err);
        window.dispatchEvent(new Event('auth-error'));// send this dispath event for ui to logout
      }
    ).finally(() => {
            isRefresh = false; // Unlock the gate, for later requests
          });
})
    }
throw error//if the error isnt 401 juts return the error norammly
  
  }
);

export default apiClient;