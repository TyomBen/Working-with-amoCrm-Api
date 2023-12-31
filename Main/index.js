import { URL } from "../Utills/accauntUrl.js";
import { URL as localHostUrl } from '../Utills/localHostUrl.js'
import { data } from "../config/config.js";

async function getContacts() {
  try {
    $("#loader").show();
    const response = await $.ajax({
      url: `${localHostUrl}/getAmoCRMData`,
      method: "POST",
      data: { data, URL }
    });
    $("#loader").hide();
    if (response) {
      response._embedded.contacts.forEach((contact) => {
        $("#contactsTable").append(`
          <tr>
          <td> ${contact.id ? contact.id : "----"} </td>
          <td> ${contact.name ? contact.name : "----"} </td>
          <td> ${contact.first_name ? contact.first_name : "----"} </td>
          <td> ${contact.last_name ? contact.last_name : "----"} </td>
          <td> <button class="btn btn-primary create-task" id=${
            contact.id
          }> Create a Task </button> </td>
          </tr>
        `);
      });
    } else {
      console.log("No Contacts");
    }
    return response;
  } catch (error) {
    console.log(
      "Ошибка при получении контактов:",
      error.statusText || error.message
    );
  }
}
export default getContacts();