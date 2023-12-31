import { URL } from "../Utills/accauntUrl.js";
import { URL as localHostUrl } from "../Utills/localHostUrl.js";
import getContacts from "./index.js";
async function createTasks() {
  $(document).on("click", function (e) {
    if ($(e.target).hasClass("modal")) {
      $("#event-modal").hide();
    }
  });

  $("#contactsTable").on("click", ".create-task", async function () {
    try {
      $("#loader").show();
      const contacts = await getContacts;
      const response = await $.ajax({
        url: `${localHostUrl}/sendingCRMTasks`,
        method: "POST",
        data: {
          URL,
          contacts: contacts._embedded.contacts,
        },
      });
      $("#loader").hide();
      const { message, success } = response;
      if (message && success === true) {
        $("#event-modal").show();
        $("#response-text").removeClass('text-danger').addClass('text-success');
        $("#response-text").text(message);
      } else {
        $("#event-modal").show();
        $("#response-text").text(message);
      }
      setTimeout(() => {
        $("#event-modal").hide();
      }, 1500);
      
    } catch (error) {
      console.log(error);
    }
  });
}
createTasks();
